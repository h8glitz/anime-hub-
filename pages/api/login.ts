import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.hashedPassword) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.hashedPassword);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  res.status(200).json({ id: user.id, email: user.email, name: user.name });
} 