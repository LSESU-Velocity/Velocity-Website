import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initFirebase } from './_firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const key = req.query.key as string;

    if (!key) {
        return res.status(400).json({ error: 'Key is required' });
    }

    try {
        const db = initFirebase();

        // Validate the key exists
        const keysRef = db.collection('keys');
        const keySnapshot = await keysRef.where('code', '==', key.trim()).get();

        if (keySnapshot.empty) {
            return res.status(401).json({ error: 'Invalid key' });
        }

        const keyDoc = keySnapshot.docs[0];

        // Fetch analyses for this key
        const analysesRef = db.collection('analyses');
        const analysesSnapshot = await analysesRef
            .where('keyId', '==', keyDoc.id)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const analyses = analysesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        }));

        return res.status(200).json(analyses);
    } catch (error) {
        console.error('Fetch analyses error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
