import type { Request, Response } from 'express'
import type { UploadedImage } from '@/validations/upload.schema'
import { asyncHandler } from '@/utils/asyncHandler'

export class UploadController {
  store = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file as Express.Multer.File & UploadedImage

    res.status(201).json({
      imageUrl: `/uploads/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    })
  })
}
