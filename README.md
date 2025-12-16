# 고객 서비스 요청 관리 시스템

Spring Boot + React + PostgreSQL로 만든 서비스 요청 관리 플랫폼입니다.

## 주요 기능

- **사용자 관리**: 관리자/매니저/고객 역할 기반 권한 관리
- **서비스 요청**: 고객이 요청 생성, 매니저가 처리
- **프로젝트 관리**: 회사별 프로젝트 생성 및 사용자 할당
- **대시보드**: 역할별 맞춤 대시보드 및 월간 실적 리포트
- **Excel 내보내기**: 각종 데이터를 Excel로 다운로드

## 기술 스택

**백엔드**
- Java 17 + Spring Boot 3.2.0
- Spring Security + JWT 인증
- MyBatis + PostgreSQL

**프론트엔드**
- React 18
- Material-UI (MUI)
- Axios + React Router

## 빠른 시작

### 1. 데이터베이스 실행

```bash
docker-compose up -d
```

PostgreSQL이 `localhost:5432`에서 실행됩니다.

### 2. 백엔드 실행

```bash
cd backend
mvn spring-boot:run
```

백엔드가 `http://localhost:8080`에서 시작됩니다.

### 3. 프론트엔드 실행

새 터미널을 열고:

```bash
cd frontend
npm install
npm start
```

React 앱이 `http://localhost:3000`에서 시작됩니다.

## 기본 테스트 계정

| 사용자명 | 비밀번호 | 역할 |
|---------|---------|------|
| `admin` | `1234` | 관리자 |
| `manager` | `1234` | 매니저 |
| `customer` | `1234` | 고객 |

## 사용자 역할

### 관리자 (ADMIN)
- 모든 사용자/회사/프로젝트 관리
- 사용자 승인/거부
- 프로젝트 요청 승인
- 모든 서비스 요청 조회

### 매니저 (MANAGER)
- 서비스 요청 처리
- 작업 시간 기록
- 할당된 프로젝트 관리
- 월간 실적 리포트

### 고객 (CUSTOMER)
- 서비스 요청 생성
- 본인 요청 조회/수정
- 프로젝트 신청
- 요청 상태 추적

## 주요 화면

- **대시보드**: 역할별 맞춤 정보
- **서비스 요청**: 요청 생성/조회/처리
- **프로젝트 관리**: 프로젝트 생성 및 사용자 할당
- **회사 관리**: 회사 정보 관리
- **월간 리포트**: 매니저별 작업 시간 집계

## 프로젝트 구조

```
customer-service-request/
├── backend/              # Spring Boot 백엔드
│   ├── src/main/java/
│   │   └── com/example/customerservice/
│   │       ├── controller/    # REST API
│   │       ├── service/       # 비즈니스 로직
│   │       ├── mapper/        # MyBatis
│   │       ├── model/         # 엔티티
│   │       ├── security/      # JWT 인증
│   │       └── config/        # 설정
│   └── src/main/resources/
│       ├── schema.sql         # DB 스키마
│       └── data.sql           # 초기 데이터
├── frontend/             # React 프론트엔드
│   └── src/
│       ├── components/        # React 컴포넌트
│       ├── services/          # API 클라이언트
│       └── context/           # 인증 상태 관리
└── docker-compose.yml    # PostgreSQL 설정
```

## 환경 요구사항

- **Java 17** 이상
- **Maven 3.6+**
- **Node.js 16+**
- **Docker** (PostgreSQL용)

## 문제 해결

### 데이터베이스 초기화
```bash
docker-compose down -v
docker-compose up -d
```

### 포트 충돌
- 백엔드: `application.properties`에서 `server.port` 변경
- 프론트엔드: `PORT=3001 npm start`

### API 연결 오류
- 백엔드가 `http://localhost:8080`에서 실행 중인지 확인
- 브라우저 콘솔에서 CORS 오류 확인

## 주요 API 엔드포인트

- `POST /api/auth/login` - 로그인
- `POST /api/auth/signup` - 회원가입
- `GET /api/service-requests` - 서비스 요청 목록
- `GET /api/projects` - 프로젝트 목록
- `GET /api/users` - 사용자 목록

## 라이선스

MIT License

---

**버전**: 1.0.0
