import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initFirebase } from '../lib/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { key } = req.body;

    if (!key || typeof key !== 'string') {
        return res.status(400).json({ valid: false, error: 'Key is required' });
    }

    try {
        const db = initFirebase();

        // Look up the key in the 'keys' collection
        const keysRef = db.collection('keys');
        const snapshot = await keysRef.where('code', '==', key.trim()).get();

        if (snapshot.empty) {
            return res.status(401).json({ valid: false, error: 'Invalid key' });
        }

        const keyDoc = snapshot.docs[0];

        return res.status(200).json({
            valid: true,
            keyId: keyDoc.id,
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ valid: false, error: 'Server error' });
    }
}
