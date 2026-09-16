import type { Request, Response } from 'express'
import { HttpError } from '@/utils/httpError'
import { asyncHandler } from '@/utils/asyncHandler'

export class UploadController {
  store = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new HttpError(400, 'No se proporcionó ningún archivo de imagen')
    }

    res.status(201).json({
      imageUrl: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    })
  })
}
