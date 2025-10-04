import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Simulate file processing
    const uploadedFiles = [];

    for (const file of files) {
      if (file instanceof File) {
        // In a real implementation, you would:
        // 1. Save the file to storage (S3, local filesystem, etc.)
        // 2. Extract text from PDFs
        // 3. Store metadata in database

        uploadedFiles.push({
          filename: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          url: `/uploads/${file.name}`, // Fake URL
          documentId: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
      }
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`
    });

  } catch (error) {
    console.error('Document upload error:', error);

    // Handle body size limit error
    if (error instanceof Error && error.message.includes('Body exceeded')) {
      return NextResponse.json(
        { error: 'File size too large. Please upload files smaller than 1MB or configure body size limit.' },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}
