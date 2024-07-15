const express = require('express')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const app = express()
const cors = require('cors') // Import cors module
const treeKill = require('tree-kill')
const port = 3001 // Chọn một cổng phù hợp
app.use(cors()) // Enable CORS for all routes
let recordingProcess

app.get('/start', (req, res) => {
  console.log('------------------STARTTTTTTTTTTTTTTTTTT')
  if (recordingProcess) {
    return res.json({
      success: false,
      message: 'Recording is already in progress',
    })
  }

  // Khởi động Playwright codegen để bắt đầu ghi lại
  recordingProcess = exec(
    'npx playwright codegen http://localhost:3000 --output playwright-script.js',
    (error, stdout, stderr) => {
      if (error) {
        console.log('CHẠY VÀO ĐÂY')
        console.error('Error starting Playwright codegen:', error)
        recordingProcess = null
        // return res.status(500).json({ success: false, error: error.message })
      }

      if (stderr) {
        console.error('Playwright stderr:', stderr)
      }

      console.log('Playwright stdout:', stdout)

      recordingProcess = null
    }
  )

  res.json({ success: true })
})

app.get('/stop', (req, res) => {
  console.log('------------------STOPPPPPPPPPPPPPPPPPPPPP')
  if (!recordingProcess) {
    return res.json({ success: false, message: 'No recording in progress' })
  }

  treeKill(recordingProcess.pid, 'SIGINT', (err) => {
    if (err) {
      console.error('Error killing recording process:', err)
      return res
        .status(500)
        .json({ success: false, error: 'Error killing recording process' })
    }

    recordingProcess = null

    const scriptPath = path.join(__dirname, 'playwright-script.js')
    fs.readFile(scriptPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading script file:', err)
        return res
          .status(500)
          .json({ success: false, error: 'Error reading script file' })
      }

      res.set('Access-Control-Allow-Origin', 'http://localhost:3000')
      res.set('Access-Control-Allow-Methods', 'GET')
      res.set('Access-Control-Allow-Headers', 'Content-Type')

      res.json({ success: true, script: data })
    })
  })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
