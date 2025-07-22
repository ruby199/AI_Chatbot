# Gemini 2.5 Flash 챗봇 with RAG

Google의 Gemini 2.5 Flash API를 사용한 웹 기반 챗봇입니다. RAG(Retrieval-Augmented Generation) 기능으로 MetIQ 문서를 검색하고 활용할 수 있습니다.

## 주요 기능

- Gemini 2.5 Flash 모델을 사용한 AI 대화
- RAG 기능으로 MetIQ 문서 기반 질의응답
- 파일 업로드 기능으로 PDF, 이미지 파일 분석
- 실시간 채팅 인터페이스
- 모던한 UI/UX

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일에 Gemini API 키가 이미 설정되어 있습니다.

### 3. 서버 실행
```bash
npm start
```

또는 개발 모드로 실행:
```bash
npm run dev
```

### 4. 브라우저에서 접속
http://localhost:3000 에서 챗봇을 사용할 수 있습니다.

## 프로젝트 구조

```
├── package.json          # 프로젝트 설정 및 의존성
├── server.js            # Express 서버 및 API 엔드포인트
├── .env                 # 환경 변수 (API 키)
├── public/              # 정적 파일들
│   ├── index.html       # 메인 HTML 파일
│   ├── style.css        # CSS 스타일
│   └── script.js        # 클라이언트 JavaScript
└── README.md           # 프로젝트 설명서
```

## API 엔드포인트

- `GET /` - 메인 페이지
- `POST /api/chat` - 챗봇 메시지 처리

## 사용된 기술

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **AI**: Google Gemini 2.5 Flash API
- **기타**: CORS, dotenv

## 주요 특징

- 깔끔하고 직관적인 사용자 인터페이스
- 실시간 글자 수 카운터
- 로딩 애니메이션
- 에러 처리 및 사용자 피드백
- 마크다운 기본 지원 (굵게, 기울임, 코드)
- 반응형 디자인으로 모든 기기에서 사용 가능

## 문제 해결

만약 API 오류가 발생한다면:
1. `.env` 파일의 API 키가 올바른지 확인
2. 인터넷 연결 상태 확인

## Demo

<img width="1482" height="1508" alt="image" src="https://github.com/user-attachments/assets/0bd14da4-2f3f-48dc-8aa6-d49496121b5c" />

## 라이선스

MIT License
