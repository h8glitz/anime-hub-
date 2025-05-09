import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, animeId } = req.body;
    if (!userId || !animeId) return res.status(400).json({ error: 'Missing fields' });
    const collection = await prisma.collection.create({
      data: { userId: String(userId), animeId }
    });
    res.status(201).json(collection);
  } else if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const collection = await prisma.collection.findMany({
      where: { userId: String(userId) },
      orderBy: { addedAt: 'desc' }
    });
    res.status(200).json(collection);
  } else {
    res.status(405).end();
  }
} 