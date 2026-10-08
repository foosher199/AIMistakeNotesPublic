/**
 * AI Recognition API
 *
 * POST /api/ai/recognize - AI 识别图片中的题目
 * 使用阿里云视觉模型识别并解析图片中的题目。
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getAuthClient } from '@/server/supabase'
import { aiRateLimiter } from '@/server/rate-limit'
import { recognizeWithAlibaba } from '@/server/ai/alibaba'
import type { AIRecognitionResult } from '@/contracts/ai'
import { logger } from '@/server/logger'
import { z } from 'zod'

export const maxDuration = 300

// 请求体验证 schema
const RecognizeRequestSchema = z.object({
  imageUrl: z.string().url('图片URL格式无效').optional(),
  imageId: z.string().uuid('图片ID格式无效').optional(),
  mode: z.literal('vision').default('vision'),
}).refine((value) => value.imageId || value.imageUrl, {
  message: '必须提供图片ID或图片URL',
})

export async function POST(request: NextRequest) {
  const log = logger('API/recognize')

  try {
    log.step('1. 创建 Supabase 客户端')
    // 优先使用Bearer Token认证（iOS/Android），回退到Cookie认证（Web）
    const authResult = await getAuthClient(request)
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { supabase, user } = authResult

    log.step('2. 限流检查 (20次/小时)')
    // 限流检查：每用户每小时 20 次
    const rateLimit = aiRateLimiter.check(`ai_recognize:${user.id}`, 20)

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
          },
        }
      )
    }

    log.step('3. 解析请求体')
    // 解析请求体
    const body = await request.json()

    // 验证请求数据
    const validation = RecognizeRequestSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.issues.map((err) => err.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { imageId, mode } = validation.data
    let imageUrl = validation.data.imageUrl
    if (imageId) {
      const { data: storedImage, error: imageError } = await supabase
        .from('mistake_images')
        .select('storage_path')
        .eq('id', imageId)
        .eq('status', 'active')
        .single()

      if (imageError || !storedImage) {
        return NextResponse.json({ error: '图片不存在或无权访问' }, { status: 404 })
      }
      const { data: signed, error: signedError } = await createAdminClient().storage
        .from('mistake-private-images')
        .createSignedUrl(storedImage.storage_path, 15 * 60)
      if (signedError || !signed?.signedUrl) {
        return NextResponse.json({ error: '生成图片访问地址失败' }, { status: 500 })
      }
      imageUrl = signed.signedUrl
    }
    if (!imageUrl) {
      return NextResponse.json({ error: '缺少图片地址' }, { status: 400 })
    }
    log.step(`4. 开始识别 (mode: ${mode})`)
    let results: AIRecognitionResult[]

    console.log('[API] 使用阿里云视觉模型 (qwen3.6-plus)')
    try {
      log.step('5. 开始阿里云 API 调用')
      results = await recognizeWithAlibaba(imageUrl)
      log.step(`5. 阿里云 API 调用完成, 识别到 ${results.length} 道题目`)
    } catch (visionError) {
      log.error('阿里云视觉识别失败', visionError)
      throw visionError
    }

    log.step('5. 验证识别结果')
    // 验证结果
    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: '未识别到题目内容，请确保图片清晰可读' },
        { status: 400 }
      )
    }

    log.step('6. 写入错题表')
    const questionsToInsert = results.map((r) => ({
      user_id: user.id,
      content: r.content,
      subject: r.subject,
      category: r.category,
      difficulty: r.difficulty,
      answer: r.answer,
      explanation: r.explanation ?? null,
      image_url: imageId ? null : imageUrl,
    }))

    const { data: insertedQuestions, error: questionError } = await supabase
      .from('mistake_questions')
      .insert(questionsToInsert)
      .select('*')

    if (questionError || !insertedQuestions || insertedQuestions.length !== results.length) {
      console.error('[API] 写入错题表失败:', questionError)
      throw new Error('识别成功，但自动保存题目失败')
    }

    if (imageId) {
      const { error: linkError } = await supabase.from('mistake_question_images').insert(
        insertedQuestions.map((question) => ({
          question_id: question.id,
          image_id: imageId,
          sort_order: 0,
        }))
      )
      if (linkError) {
        await supabase
          .from('mistake_questions')
          .delete()
          .in('id', insertedQuestions.map((question) => question.id))
        console.error('[API] 关联题目原图失败:', linkError)
        throw new Error('识别成功，但保存题目原图失败')
      }
    }

    log.step(`6.1 自动保存完成: ${insertedQuestions.length} 条`)

    log.done(`识别完成，返回 ${results.length} 条结果`)
    return NextResponse.json({ results, questions: insertedQuestions })
  } catch (error) {
    log.error('识别失败', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '识别失败，请稍后重试' },
      { status: 500 }
    )
  }
}
