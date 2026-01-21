import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptions, filters, view, metric, summary, authorName } = body;

    if (!subscriptions || !Array.isArray(subscriptions)) {
      return NextResponse.json({ error: 'Invalid request: subscriptions array required' }, { status: 400 });
    }

    const db = await getDatabase();
    const reportsCollection = db.collection('reports');

    const report = {
      subscriptions,
      filters: filters || {},
      view: view || 'treemap',
      metric: metric || 'revenue',
      summary: summary || {},
      authorName: authorName || 'Anonymous',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await reportsCollection.insertOne(report);

    return NextResponse.json({
      success: true,
      reportId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error('Error saving report:', error);
    return NextResponse.json(
      { error: 'Failed to save report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
    }

    const db = await getDatabase();
    const reportsCollection = db.collection('reports');

    let report;
    try {
      report = await reportsCollection.findOne({ _id: new ObjectId(reportId) });
    } catch (error) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Remove MongoDB internal fields
    const { _id, ...reportData } = report;

    return NextResponse.json({
      success: true,
      report: {
        id: _id.toString(),
        ...reportData,
      },
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
