const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer 설정 (파일 업로드용)
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Initialize Gemini AI
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// MetIQ 문서 정보 및 내용 저장
let metiqDocuments = [];
let documentContents = new Map();

// 서버 시작 시 MetIQ 문서 로드
async function loadMetIQDocuments() {
  try {
    const metiqPath = path.join(__dirname, 'RAG문서들');
    if (fs.existsSync(metiqPath)) {
      const files = fs.readdirSync(metiqPath);
      
      for (const file of files) {
        if (file.endsWith('.pdf') || file.endsWith('.txt')) {
          const filePath = path.join(metiqPath, file);
          const doc = {
            name: file,
            path: filePath,
            description: `RAG문서들: ${file.replace(/\.(pdf|txt)$/, '')}`,
            type: file.endsWith('.pdf') ? 'pdf' : 'txt'
          };
          
          // 파일 내용 추출
          try {
            if (file.endsWith('.pdf')) {
              const dataBuffer = fs.readFileSync(filePath);
              const pdfData = await pdfParse(dataBuffer);
              documentContents.set(file, pdfData.text);
            } else if (file.endsWith('.txt')) {
              const textData = fs.readFileSync(filePath, 'utf8');
              documentContents.set(file, textData);
            }
            doc.hasContent = true;
          } catch (error) {
            console.warn(`파일 파싱 실패: ${file}`, error.message);
            doc.hasContent = false;
          }
          
          metiqDocuments.push(doc);
        }
      }
    }
    console.log(`📄 문서 ${metiqDocuments.length}개가 로드되었습니다.`);
  } catch (error) {
    console.error(' 문서 로드 오류:', error);
  }
}

// RAG 검색 함수
function performRAGSearch(query) {
  const keywords = query.toLowerCase().split(' ');
  const relevantDocs = [];
  
  for (const doc of metiqDocuments) {
    const content = documentContents.get(doc.name) || '';
    const isRelevant = keywords.some(keyword => 
      doc.name.toLowerCase().includes(keyword) ||
      doc.description.toLowerCase().includes(keyword) ||
      content.toLowerCase().includes(keyword) ||
      keyword.includes('finops') ||
      keyword.includes('metiq') ||
      keyword.includes('지원') ||
      keyword.includes('모델')
    );
    
    if (isRelevant) {
      relevantDocs.push({
        ...doc,
        content: content.substring(0, 2000) // 처음 2000자만 사용
      });
    }
  }

  if (relevantDocs.length === 0) {
    return null;
  }

  const context = relevantDocs.map(doc => 
    `문서명: ${doc.name}
설명: ${doc.description}
내용 일부: ${doc.content}
---`
  ).join('\n\n');

  return `다음 MetIQ 문서들을 참고하여 질문에 답해주세요:

${context}

질문: ${query}

위 문서들의 내용을 바탕으로 정확하고 도움이 되는 답변을 제공해주세요.`;
}

// 문서 목록 API
app.get('/api/documents', (req, res) => {
  res.json({
    success: true,
    documents: metiqDocuments.map(doc => ({
      name: doc.name,
      description: doc.description,
      type: doc.type,
      hasContent: doc.hasContent
    }))
  });
});

// 문서 다운로드 API
app.get('/api/download/:name', (req, res) => {
  const docName = req.params.name;
  const doc = metiqDocuments.find(doc => doc.name === docName);
  
  if (!doc) {
    return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });
  }
  
  res.download(doc.path, docName);
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode = 'default', files = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '메시지가 필요합니다.' });
    }

    let finalMessage = message;
    const parts = [{ text: message }];

    // RAG 모드 처리
    if (mode === 'rag') {
      const ragPrompt = performRAGSearch(message);
      if (ragPrompt) {
        finalMessage = ragPrompt;
        parts[0].text = ragPrompt;
      }
    }

    // 파일 처리 (base64 데이터)
    if (files && files.length > 0) {
      files.forEach(file => {
        if (file.data && file.mimeType) {
          parts.push({
            inline_data: {
              mime_type: file.mimeType,
              data: file.data
            }
          });
        }
      });
    }

    // Generate content using Gemini 2.5 Flash
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        parts: parts
      }]
    });

    const reply = response.text;
    
    res.json({ 
      success: true, 
      reply: reply,
      mode: mode,
      documentsUsed: mode === 'rag' ? metiqDocuments.length : 0
    });

  } catch (error) {
    console.error('Gemini API 오류:', error);
    res.status(500).json({ 
      error: 'AI 응답을 생성하는 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// Serve HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
async function startServer() {
  await loadMetIQDocuments();
  
  app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT}에서 실행 중입니다.`);
    console.log(`🌐 네트워크에서 접속 가능: http://[당신의IP]:${PORT}`);
    console.log(`📱 핸드폰에서도 접속 가능합니다!`);
    console.log(`📁 RAG 기능이 활성화되었습니다.`);
  });
}

startServer();
