const express = require('express')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const app = express()
const cors = require('cors') // Import cors module
const treeKill = require('tree-kill')
const port = 3001 // Chọn một cổng phù hợp
app.use(cors()) // Enable CORS for all routes
const { chromium } = require('playwright')
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

app.get('/locators', async (req, res) => {
  console.log('------------------GET LOCATORS------------------')

  let browser

  try {
    // Khởi tạo trình duyệt Chromium
    browser = await chromium.launch()

    // Tạo một trang mới
    const page = await browser.newPage()

    // Điều hướng đến trang web localhost:3000
    await page.goto('http://localhost:3000')

    // // Lấy danh sách các element trên trang
    // const elements = await page.evaluate(() => {
    //   // Sử dụng document.querySelectorAll để lấy tất cả các element
    //   const elements = Array.from(document.querySelectorAll('*'))
    //   return elements.map((element) => ({
    //     tagName: element.tagName.toLowerCase(),
    //     id: element.id,
    //     className: element.className,
    //     textContent: element.textContent.trim(),
    //     attributes: Array.from(element.attributes).map((attr) => ({
    //       name: attr.name,
    //       value: attr.value,
    //     })),
    //   }))
    // })

    // // Lấy thông tin từ các phần tử trên trang
    // const elements = await page.$$eval('*', (nodes) => {
    //   return nodes.map((node) => {
    //     const tagName = node.tagName.toLowerCase()
    //     const attributes = {}
    //     for (const { name, value } of node.attributes) {
    //       attributes[name] = value
    //     }
    //     const textContent = node.textContent.trim()

    //     // Kiểm tra nếu có thẻ cha, thẻ con, và thẻ con có textContent
    //     const parentTagName = node.parentElement
    //       ? node.parentElement.tagName.toLowerCase()
    //       : null
    //     const hasChildren = node.children.length > 0
    //     const hasTextContent = !!textContent

    //     return {
    //       tagName,
    //       attributes,
    //       textContent,
    //       parentTagName,
    //       hasChildren,
    //       hasTextContent,
    //     }
    //   })
    // })

    // Lấy thông tin các thẻ HTML từ trang web
    const elements = await page.$$eval('*', (elements) => {
      // Hàm để lấy thông tin của mỗi phần tử
      const getElementInfo = (element) => {
        const info = {
          tag: element.tagName.toLowerCase(),
          attributes: {},
          hasTextContent: false,
          htmlSyntax: element.outerHTML,
        }

        // Lấy các thuộc tính của thẻ
        for (const attr of element.attributes) {
          info.attributes[attr.name] = attr.value
        }

        // Kiểm tra xem thẻ có chứa textContent hay không
        if (element.textContent.trim().length > 0) {
          info.hasTextContent = true
        }

        return info
      }

      // Thu thập thông tin của tất cả các phần tử
      return Array.from(elements).map(getElementInfo)
    })

    // Đóng trang và trình duyệt
    await page.close()
    await browser.close()

    // const locators = {
    //   parentElements: elements.filter((info) => !info.hasTextContent),
    //   childElements: elements.filter((info) => info.hasTextContent),
    // }

    // Trả về danh sách các locator
    res.json({ success: true, elements })
  } catch (error) {
    console.error('Error:', error)
    if (browser) {
      await browser.close()
    }
    res.status(500).json({ success: false, error: error.message })
  }
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})

