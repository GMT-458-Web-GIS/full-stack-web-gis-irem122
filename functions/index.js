const express = require('express')
const cors = require('cors')
const admin = require('firebase-admin')

// Initialize admin SDK - replace with actual service account in production
if (!admin.apps.length) {
  // admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) })
  admin.initializeApp()
}

const db = admin.firestore()
const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

// Basit suggestions list (filter query params)
app.get('/suggestions', async (req, res) => {
  try {
    const { country, city, timeSlot, category } = req.query
    let q = db.collection('suggestions').where('visibility', '==', 'public')
    // Firestore composite queries may require indexes; for demo do client-side filtering after fetch
    const snap = await q.get()
    let data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    if (country) data = data.filter(s => s.country && s.country.toLowerCase().includes(country.toLowerCase()))
    if (city) data = data.filter(s => s.city && s.city.toLowerCase().includes(city.toLowerCase()))
    if (timeSlot) data = data.filter(s => s.timeSlot === timeSlot)
    if (category) data = data.filter(s => s.category === category)
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server error' })
  }
})

// örnek protected admin endpoint (token doğrulama)
app.post('/admin/moderate', async (req, res) => {
  // ... burada id token doğrulama ve custom claim admin kontrolü yapılmalı ...
  res.status(501).json({ error: 'Not implemented in demo' })
})

const PORT = process.env.PORT || 5001
app.listen(PORT, ()=> console.log('Functions server listening on', PORT))