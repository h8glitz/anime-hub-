export default function handler(req, res) {
  res.status(200).json({ db: process.env.DATABASE_URL });
} 