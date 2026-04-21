import { NextRequest, NextResponse } from 'next/server';
import { getTools, createTool, updateTool, deleteTool, getToolById, getCategories } from '@/services/toolsService';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const id = searchParams.get('id') || undefined;

    // Get single tool by ID
    if (id) {
      const response = await getToolById(id);
      return NextResponse.json(response);
    }

    // Get categories
    if (searchParams.get('categories') === 'true') {
      const response = await getCategories();
      return NextResponse.json(response);
    }

    // Get tools with filters
    const response = await getTools({ category, status, search });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tools API error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const response = await createTool(body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tools API create error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: { message: 'Tool ID required' } }, { status: 400 });
    }

    const body = await request.json();
    const response = await updateTool(id, body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tools API update error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: { message: 'Tool ID required' } }, { status: 400 });
    }

    const response = await deleteTool(id);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Tools API delete error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}