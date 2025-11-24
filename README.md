# 고객 서비스 요청 관리 시스템

Spring Boot, React, PostgreSQL로 구축된 엔터프라이즈급 서비스 요청 및 프로젝트 관리 플랫폼입니다.

## 주요 기능

### 사용자 관리
- 3단계 역할 기반 접근 제어 (관리자/매니저/고객)
- 사용자 승인 워크플로우 (회원가입 → 관리자 승인 → 활성화)
- JWT 기반 인증 및 BCrypt 비밀번호 암호화
- 사용자별 회사 및 프로젝트 할당
- 이메일 및 비밀번호 변경 기능

### 서비스 요청 관리
- 고객이 서비스 요청 생성 (제목, 설명, 우선순위, 마감일)
- 매니저에게 요청 할당 및 상태 추적
- 5단계 상태 관리: 접수 → 진행중 → 해결완료/보류 → 취소
- 4단계 우선순위: 낮음, 보통, 높음, 긴급
- 작업 시간 및 해결 노트 기록
- 역할별 필터링 및 검색 기능

### 프로젝트 관리
- 회사별 프로젝트 생성 및 관리
- 서비스 유형: 유지보수(Maintenance), 장애수리(Defect Repair)
- 계약 기간 및 M/D(Man-Days) 관리
- 사용자별 프로젝트 할당
- 프로젝트 요청 승인 시스템 (고객 신청 → 관리자 승인 → 프로젝트 생성)

### 회사 관리
- 회사 정보 관리 (회사명, 회사코드, 사업자번호)
- 회사별 프로젝트 및 사용자 연동
- Excel 내보내기 기능

### 대시보드 및 리포팅
- 역할별 맞춤 대시보드 (관리자/매니저/고객)
- 매니저 월간 실적 리포트 (프로젝트별 일일 작업시간 기록)
- 캘린더 통합 (마감일 표시 및 알림)
- 날씨 정보 통합 (OpenWeatherMap API)
- Excel 다운로드 기능 (사용자 목록, 회사 목록, 프로젝트 목록 등)

## 기술 스택

### 백엔드
- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Security** - JWT 인증 및 역할 기반 권한 관리
- **MyBatis 3.0.3** - 어노테이션 기반 SQL 매핑
- **PostgreSQL 16** - 메인 데이터베이스
- **Maven** - 빌드 및 의존성 관리
- **JJWT 0.12.3** - JWT 토큰 생성 및 검증

### 프론트엔드
- **React 18**
- **Material-UI (MUI) v7.3.5** - UI 컴포넌트 라이브러리
- **MUI X Data Grid 8.18.0** - 고급 데이터 그리드
- **Axios 1.6.0** - HTTP 클라이언트
- **React Router v6** - 라우팅
- **React Calendar** - 캘린더 컴포넌트
- **XLSX 0.18.5** - Excel 파일 생성
- **Emotion** - CSS-in-JS 스타일링

### 데이터베이스
- **PostgreSQL 16 Alpine** (Docker)

## 프로젝트 구조

```
customer-service-request/
├── backend/                              # Spring Boot 백엔드
│   ├── src/main/java/com/example/customerservice/
│   │   ├── controller/                   # REST API 컨트롤러 (6개)
│   │   │   ├── AuthController.java       # 인증 (회원가입/로그인)
│   │   │   ├── UserController.java       # 사용자 관리
│   │   │   ├── ServiceRequestController.java  # 서비스 요청 관리
│   │   │   ├── CompanyController.java    # 회사 관리
│   │   │   ├── ProjectController.java    # 프로젝트 관리
│   │   │   └── ProjectRequestController.java  # 프로젝트 요청 승인
│   │   ├── service/                      # 비즈니스 로직 (6개)
│   │   ├── mapper/                       # MyBatis 매퍼 (5개)
│   │   ├── model/                        # 도메인 모델 (5개)
│   │   │   ├── User.java                 # 사용자 엔티티
│   │   │   ├── Company.java              # 회사 엔티티
│   │   │   ├── Project.java              # 프로젝트 엔티티
│   │   │   ├── ServiceRequest.java       # 서비스 요청 엔티티
│   │   │   └── ProjectRequest.java       # 프로젝트 요청 엔티티
│   │   ├── dto/                          # 데이터 전송 객체 (8개)
│   │   ├── security/                     # 보안 설정
│   │   │   ├── JwtTokenProvider.java     # JWT 토큰 생성/검증
│   │   │   ├── JwtAuthenticationFilter.java  # JWT 필터
│   │   │   └── CustomUserDetailsService.java # 사용자 인증
│   │   └── config/                       # 설정 클래스
│   │       ├── SecurityConfig.java       # Spring Security 설정
│   │       ├── WebConfig.java            # CORS 설정
│   │       └── DataInitializer.java      # 초기 데이터 생성
│   ├── src/main/resources/
│   │   ├── application.properties        # 애플리케이션 설정
│   │   ├── schema.sql                    # 데이터베이스 스키마 (DDL)
│   │   └── data.sql                      # 초기 데이터 (테스트 계정)
│   └── pom.xml                           # Maven 의존성
├── frontend/                             # React 프론트엔드
│   ├── src/
│   │   ├── components/                   # React 컴포넌트 (13개)
│   │   │   ├── AuthPage.js               # 로그인/회원가입 (274줄)
│   │   │   ├── DashboardHome.js          # 메인 대시보드 (877줄)
│   │   │   ├── ServiceRequestList.js     # 서비스 요청 관리 (1136줄)
│   │   │   ├── UserList.js               # 사용자 관리 (557줄)
│   │   │   ├── PendingUserList.js        # 사용자 승인 관리 (148줄)
│   │   │   ├── CompanyList.js            # 회사 관리 (302줄)
│   │   │   ├── ProjectList.js            # 프로젝트 관리 (444줄)
│   │   │   ├── ProjectRequestList.js     # 프로젝트 신청 (고객용, 458줄)
│   │   │   ├── ProjectRequestApproval.js # 프로젝트 승인 (관리자용, 507줄)
│   │   │   ├── AdminProjectMapping.js    # 프로젝트 할당 (358줄)
│   │   │   ├── MyProjectList.js          # 내 프로젝트 목록 (137줄)
│   │   │   ├── ManagerMonthlyReport.js   # 매니저 월간 리포트 (629줄)
│   │   │   └── UserProfile.js            # 사용자 프로필 (251줄)
│   │   ├── context/
│   │   │   └── AuthContext.js            # 전역 인증 상태 관리
│   │   ├── services/
│   │   │   └── api.js                    # Axios API 클라이언트
│   │   ├── utils/
│   │   │   └── dateFormatter.js          # 날짜 포맷 유틸리티
│   │   ├── styles/                       # CSS 스타일
│   │   ├── App.js                        # 메인 앱 및 라우팅
│   │   └── index.js                      # 엔트리 포인트
│   └── package.json                      # npm 의존성
├── docker-compose.yml                    # PostgreSQL 컨테이너 설정
├── init-db.sh                            # 데이터베이스 초기화 스크립트
└── README.md
```

## 사전 요구사항

- **Java 17** 이상
- **Maven 3.6+**
- **Node.js 16+** 및 npm
- **Docker** 및 **Docker Compose** (PostgreSQL 실행용)

## 설치 및 실행 방법

### 1. 저장소 클론

```bash
git clone <repository-url>
cd customer-service-request
```

### 2. 데이터베이스 설정

Docker Compose를 사용하여 PostgreSQL을 실행합니다:

```bash
docker-compose up -d
```

PostgreSQL이 `localhost:5432`에서 실행되며, 데이터베이스 `customer_service`가 자동으로 생성됩니다.

**데이터베이스 정보:**
- 호스트: `localhost`
- 포트: `5432`
- 데이터베이스: `customer_service`
- 사용자명: `postgres`
- 비밀번호: `postgres`

### 3. 백엔드 설정 및 실행

백엔드 디렉토리로 이동하여 실행:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

백엔드 서버가 `http://localhost:8080`에서 시작됩니다.

애플리케이션 시작 시 자동으로:
- 데이터베이스 스키마 생성 (`schema.sql`)
- 테스트 데이터 삽입 (`data.sql`)
- 기본 계정 3개 생성 (admin, manager, customer)

**기본 테스트 계정:**
| 사용자명 | 비밀번호 | 역할 | 승인상태 |
|---------|---------|------|---------|
| `admin` | `1234` | ROLE_ADMIN | APPROVED |
| `manager` | `1234` | ROLE_MANAGER | APPROVED |
| `customer` | `1234` | ROLE_CUSTOMER | APPROVED |

**중요:** 프로덕션 환경에서는 첫 로그인 후 반드시 비밀번호를 변경하세요.

### 4. 프론트엔드 설정 및 실행

새 터미널을 열고 프론트엔드 디렉토리로 이동:

```bash
cd frontend
npm install
npm start
```

React 애플리케이션이 `http://localhost:3000`에서 시작됩니다.

브라우저가 자동으로 열리지 않으면 `http://localhost:3000`을 직접 입력하세요.

## 사용 매뉴얼

### 1. 첫 시작하기

#### 1단계: 데이터베이스 실행
```bash
docker-compose up -d
```

#### 2단계: 백엔드 서버 실행
```bash
cd backend
mvn spring-boot:run
```

#### 3단계: 프론트엔드 실행 (새 터미널)
```bash
cd frontend
npm start
```

#### 4단계: 브라우저에서 접속
`http://localhost:3000` 접속

### 2. 사용자 역할 및 권한

시스템은 3가지 역할로 구분됩니다:

#### 🔴 관리자 (ROLE_ADMIN)
- **전체 시스템 관리자**
- 모든 사용자 조회 및 관리 (역할 변경, 승인/거부, 삭제)
- 회사 생성/수정/삭제
- 프로젝트 생성/수정/삭제 및 사용자 할당
- 프로젝트 요청 승인/거부
- 모든 서비스 요청 조회 및 관리
- 사용자 이메일/비밀번호 변경

#### 🟡 매니저 (ROLE_MANAGER)
- **서비스 요청 처리 담당자**
- 할당된 프로젝트의 서비스 요청 조회
- 할당되지 않은 요청을 본인에게 할당 (상태: IN_PROGRESS로 변경)
- 요청 상태 변경 (IN_PROGRESS, RESOLVED, HOLD)
- 작업 시간 기록 (hours_spent)
- 해결 노트 작성 (resolution_notes)
- 할당된 요청 해제 가능
- 자신의 프로젝트 조회

#### 🟢 고객 (ROLE_CUSTOMER)
- **서비스 요청 생성자**
- 서비스 요청 생성 (제목, 설명, 우선순위, 마감일)
- 본인의 요청만 조회/수정/삭제
- 프로젝트 신청 (관리자 승인 필요)
- 할당된 프로젝트 조회
- 요청 상태 추적

### 3. 로그인 및 회원가입

#### 기존 계정으로 로그인
1. 로그인 페이지에서 사용자명과 비밀번호 입력
2. 테스트 계정 중 하나 사용:
   - 관리자: `admin` / `1234`
   - 매니저: `manager` / `1234`
   - 고객: `customer` / `1234`
3. "로그인" 버튼 클릭
4. 역할에 맞는 대시보드로 이동

#### 새 사용자 회원가입
1. 로그인 페이지에서 "회원가입" 탭 클릭
2. 필수 정보 입력:
   - **사용자 ID**: 로그인용 고유 ID
   - **사용자명**: 화면에 표시될 이름
   - **이메일**: 유효한 이메일 주소
   - **비밀번호**: 안전한 비밀번호
3. "회원가입" 버튼 클릭
4. **승인 대기 상태** (PENDING)로 계정 생성됨
5. 관리자가 승인할 때까지 로그인 불가
6. 관리자가 승인하면 자동으로 이메일 통지 (구현 시)

#### 사용자 승인 프로세스 (관리자)
1. 관리자 계정으로 로그인
2. 좌측 메뉴에서 "사용자 승인" 클릭
3. 승인 대기 중인 사용자 목록 확인
4. 각 사용자의 정보 검토
5. 역할 선택 (고객/매니저/관리자)
6. 회사 선택 (선택사항)
7. "승인" 버튼 클릭 → 사용자 활성화
8. 또는 "거부" 버튼으로 가입 거부

### 4. 서비스 요청 관리

#### 4.1 서비스 요청 생성 (고객)

1. 고객 계정으로 로그인
2. "서비스 요청" 메뉴 클릭
3. "새 요청 등록" 버튼 클릭
4. 요청 정보 입력:
   - **제목**: 요청의 간단한 제목 (예: "로그인 오류 수정 요청")
   - **설명**: 상세한 문제 설명 (증상, 재현 방법 등)
   - **우선순위**:
     - 낮음 (LOW): 일반적인 문의
     - 보통 (MEDIUM): 일반적인 문제
     - 높음 (HIGH): 빠른 처리 필요
     - 긴급 (URGENT): 즉시 처리 필요
   - **프로젝트**: 관련 프로젝트 선택
   - **마감일**: yyyyMMdd 형식 (예: 20241225)
5. "등록" 버튼 클릭
6. 요청이 "접수(OPEN)" 상태로 생성됨

#### 4.2 서비스 요청 조회 및 필터링

**고객:**
- 본인이 생성한 요청만 표시됨
- 상태별 필터: 모두/접수/진행중/해결완료/보류/취소
- 우선순위별 필터: 모두/낮음/보통/높음/긴급
- 검색 기능: 제목, 설명으로 검색

**매니저:**
- 자신에게 할당된 요청 표시
- 자신의 프로젝트와 연관된 요청 표시
- 할당되지 않은 요청 표시 (본인에게 할당 가능)

**관리자:**
- 모든 사용자의 모든 요청 표시
- 고급 필터링 및 검색 가능

#### 4.3 서비스 요청 처리 (매니저)

1. 매니저 계정으로 로그인
2. "서비스 요청" 메뉴 클릭
3. 처리할 요청 선택:
   - **할당되지 않은 요청**: "할당" 버튼 클릭 → 본인에게 할당 및 IN_PROGRESS로 변경
   - **이미 할당된 요청**: 상태 변경 가능
4. 작업 진행 중:
   - 상태를 "진행중(IN_PROGRESS)"로 유지
   - 작업 시간 기록 (시간 단위)
   - 해결 노트에 진행사항 기록
5. 작업 완료 시:
   - 상태를 "해결완료(RESOLVED)"로 변경
   - 총 작업 시간 입력
   - 해결 내용 상세 기록
6. 보류가 필요한 경우:
   - 상태를 "보류(HOLD)"로 변경
   - 보류 사유 기록
7. 요청 해제:
   - "할당 해제" 버튼으로 다른 매니저에게 재할당 가능

#### 4.4 서비스 요청 수정 (고객)

1. "서비스 요청" 목록에서 수정할 요청 선택
2. "수정" 버튼 클릭
3. 수정 가능 항목:
   - 제목
   - 설명
   - 우선순위
   - 프로젝트
   - 마감일
4. "저장" 버튼 클릭
5. **주의**: 매니저가 이미 처리 중인 요청은 신중히 수정

#### 4.5 서비스 요청 삭제

- **고객**: 본인의 요청 중 아직 처리되지 않은 요청만 삭제 가능
- **관리자**: 모든 요청 삭제 가능
- 삭제 시 확인 메시지 표시
- **주의**: 삭제는 복구 불가능

#### 4.6 상태 전이 흐름

```
접수(OPEN)
    ↓ 매니저 할당
진행중(IN_PROGRESS)
    ↓ 작업 완료
해결완료(RESOLVED)
    ↓ 확인 후
종료(CLOSED)

보류(HOLD) ← 언제든지 전환 가능
취소(CANCELLED) ← 언제든지 취소 가능
```

### 5. 회사 관리 (관리자)

#### 5.1 회사 생성

1. 관리자 계정으로 로그인
2. "회사 관리" 메뉴 클릭
3. "새 회사 추가" 버튼 클릭
4. 회사 정보 입력:
   - **회사명**: 정식 회사명
   - **회사코드**: 영문 약자 (예: ACME, GOOGLE)
   - **사업자번호**: 000-00-00000 형식
5. "등록" 버튼 클릭

#### 5.2 회사 수정 및 삭제

- **수정**: 회사 행 클릭 → 정보 수정 → 저장
- **삭제**: 삭제 버튼 클릭 → 확인
- **주의**: 회사 삭제 시 연결된 프로젝트도 영향을 받을 수 있음

#### 5.3 회사 목록 Excel 내보내기

1. "Export to Excel" 버튼 클릭
2. `companies_YYYYMMDD.xlsx` 파일 다운로드
3. Excel에서 회사 목록 확인 가능

### 6. 프로젝트 관리 (관리자)

#### 6.1 프로젝트 생성

1. "프로젝트 관리" 메뉴 클릭
2. "새 프로젝트 추가" 버튼 클릭
3. 프로젝트 정보 입력:
   - **회사**: 드롭다운에서 선택
   - **프로젝트명**: 프로젝트 이름
   - **서비스 유형**:
     - **유지보수(MAINTENANCE)**: 정기 유지보수
     - **장애수리(DEFECT_REPAIR)**: 긴급 장애 처리
   - **계약 시작일**: YYYY-MM-DD
   - **계약 종료일**: YYYY-MM-DD
   - **계약 M/D**: 계약된 Man-Days (예: 20.5)
4. "등록" 버튼 클릭

#### 6.2 프로젝트 수정 및 삭제

- **수정**: 프로젝트 행 선택 → 정보 수정 → 저장
- **삭제**: 삭제 버튼 클릭 → 확인

#### 6.3 프로젝트에 사용자 할당

**방법 1: 프로젝트 관리 화면에서**
1. "프로젝트 관리" 메뉴
2. 프로젝트 선택 → "사용자 할당" 버튼
3. 매니저 또는 고객 선택
4. 저장

**방법 2: 프로젝트 매핑 화면에서**
1. "프로젝트 매핑" 메뉴 클릭
2. 사용자 선택
3. 할당할 프로젝트 체크박스 선택
4. "프로젝트 할당" 버튼 클릭

### 7. 프로젝트 요청 및 승인

#### 7.1 프로젝트 요청 (고객)

1. 고객 계정으로 로그인
2. "프로젝트 요청" 메뉴 클릭
3. "새 프로젝트 신청" 버튼 클릭
4. 요청 정보 입력:
   - 회사 선택
   - 프로젝트명
   - 서비스 유형
   - 계약 기간
   - 계약 M/D
5. "신청" 버튼 클릭
6. 상태가 "승인 대기(PENDING)"로 설정됨
7. 관리자 승인 대기

#### 7.2 프로젝트 요청 승인 (관리자)

1. 관리자 계정으로 로그인
2. "프로젝트 승인" 메뉴 클릭
3. 승인 대기 중인 요청 목록 확인
4. 요청 내용 검토
5. **승인**:
   - "승인" 버튼 클릭
   - 승인 노트 입력 (선택사항)
   - 자동으로 프로젝트가 생성됨
   - 요청자에게 프로젝트 자동 할당
6. **거부**:
   - "거부" 버튼 클릭
   - 거부 사유 입력
   - 요청 상태가 "거부(REJECTED)"로 변경

### 8. 대시보드 활용

#### 8.1 관리자 대시보드

관리자 로그인 시 표시되는 정보:
- **최근 사용자 5명** (역할 뱃지 포함)
- **등록된 회사 5개**
- **진행 중인 프로젝트 5개**
- **최근 서비스 요청 5개**
- **빠른 통계**: 전체 사용자 수, 회사 수, 프로젝트 수, 요청 수

#### 8.2 매니저 대시보드

매니저 로그인 시 표시되는 정보:
- **할당된 프로젝트 목록**
- **할당되지 않은 요청** (즉시 처리 가능)
- **진행 중인 요청** (본인이 처리 중)
- **보류 중인 요청**
- **캘린더**: 마감일이 있는 요청 표시
  - 날짜 클릭 시 해당 마감일의 요청 목록 표시
  - 주말 하이라이트 (토요일: 파란색, 일요일: 빨간색)
- **날씨 정보**: 현재 위치의 날씨 (OpenWeatherMap API)

#### 8.3 고객 대시보드

고객 로그인 시 표시되는 정보:
- **할당된 프로젝트**
- **진행 중인 요청** (매니저가 처리 중)
- **보류 중인 요청**
- **해결 완료된 요청**
- **캘린더**: 마감일 추적
- **날씨 정보**

### 9. 매니저 월간 실적 리포트

매니저의 월별 작업 시간을 프로젝트별로 추적하는 고급 기능입니다.

#### 9.1 리포트 조회

1. 매니저 또는 관리자 계정으로 로그인
2. "월간 리포트" 메뉴 클릭
3. 필터 설정:
   - **년도**: 연도 선택
   - **월**: 1~12월 선택
   - **매니저**: 조회할 매니저 선택 (관리자는 모든 매니저, 매니저는 본인만)
4. "조회" 버튼 클릭

#### 9.2 리포트 내용

리포트는 다음과 같이 구성됩니다:

| 회사명 | 프로젝트 | M/D | 1일 | 2일 | ... | 31일 | 계 |
|-------|---------|-----|-----|-----|-----|-----|-----|
| ABC Corp | 프로젝트A | 20.0 | 8 | 8 | ... | 0 | 160 |
| ABC Corp | 프로젝트B | 10.0 | 4 | 4 | ... | 0 | 80 |
| XYZ Inc | 프로젝트C | 15.0 | 8 | 0 | ... | 8 | 120 |

- **회사명**: 같은 회사의 프로젝트는 병합 표시
- **M/D**: 계약된 Man-Days
- **일별 시간**: 해당 날짜에 작업한 시간 (시간 단위)
- **주말 하이라이트**: 토요일(파란색), 일요일(빨간색)
- **계**: 해당 프로젝트의 월간 총 작업 시간

#### 9.3 Excel 내보내기

1. 리포트 조회 후 "Export to Excel" 버튼 클릭
2. 파일명 형식: `manager_report_홍길동_202411.xlsx`
3. Excel 파일 특징:
   - 헤더: 굵게, 파란색 배경, 흰색 텍스트
   - 컬럼 너비 자동 조정
   - 회사별, 프로젝트별 정렬
   - 수식 없이 값만 저장 (인쇄 및 공유 용이)

### 10. 사용자 프로필 관리

#### 10.1 내 정보 수정

1. 우측 상단 사용자명 클릭
2. "프로필" 메뉴 선택
3. 수정 가능 항목:
   - 사용자명 (화면 표시명)
   - 이메일

#### 10.2 비밀번호 변경

1. 프로필 페이지에서 "비밀번호 변경" 섹션
2. 현재 비밀번호 입력
3. 새 비밀번호 입력 및 확인
4. "변경" 버튼 클릭

### 11. Excel 내보내기 기능

시스템 전반에 걸쳐 Excel 내보내기를 지원합니다:

- ✅ **사용자 목록** → `users_YYYYMMDD.xlsx`
- ✅ **회사 목록** → `companies_YYYYMMDD.xlsx`
- ✅ **프로젝트 목록** → `projects_YYYYMMDD.xlsx`
- ✅ **프로젝트 요청 목록** → `project_requests_YYYYMMDD.xlsx`
- ✅ **매니저 월간 리포트** → `manager_report_이름_YYYYMM.xlsx`

모든 Excel 파일은:
- 한글 파일명 지원
- UTF-8 인코딩
- 헤더 서식 적용
- 날짜 및 숫자 서식 적용

## API 엔드포인트

### 인증 (Authentication) - `/api/auth`
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/signup` | 회원가입 (승인 대기 상태로 생성) | 공개 |
| POST | `/login` | 로그인 및 JWT 토큰 발급 | 공개 |

### 사용자 관리 (Users) - `/api/users`
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/` | 전체 사용자 조회 | ADMIN |
| GET | `/{id}` | 사용자 상세 조회 | 본인 또는 ADMIN |
| GET | `/managers` | 매니저 목록 조회 | 인증된 사용자 |
| GET | `/pending` | 승인 대기 사용자 조회 | ADMIN |
| PUT | `/{id}/role` | 역할 및 회사 변경 | ADMIN |
| PUT | `/{id}/email` | 이메일 변경 | 본인 또는 ADMIN |
| PUT | `/{id}/password` | 비밀번호 변경 | 본인 또는 ADMIN |
| POST | `/{id}/approve` | 사용자 승인 (역할 할당) | ADMIN |
| POST | `/{id}/reject` | 사용자 거부 | ADMIN |
| DELETE | `/{id}` | 사용자 삭제 | ADMIN |
| PUT | `/{id}/assign-projects` | 프로젝트 할당 | ADMIN |
| GET | `/{id}/projects` | 사용자 프로젝트 조회 | 본인 또는 ADMIN |

### 서비스 요청 (Service Requests) - `/api/service-requests`
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/` | 서비스 요청 목록 | 역할별 필터링 |
| GET | `/{id}` | 요청 상세 조회 | 관련자 |
| GET | `/customer/{customerId}` | 고객별 요청 조회 | 본인 또는 ADMIN |
| GET | `/manager/{managerId}` | 매니저별 요청 조회 | 본인 또는 ADMIN |
| GET | `/status/{status}` | 상태별 요청 조회 | 인증된 사용자 |
| GET | `/priority/{priority}` | 우선순위별 요청 조회 | 인증된 사용자 |
| POST | `/` | 새 요청 생성 | CUSTOMER, ADMIN |
| PUT | `/{id}` | 요청 수정 | 작성자 또는 ADMIN |
| PATCH | `/{id}/status` | 상태 변경 | MANAGER, ADMIN |
| PATCH | `/{id}/unassign` | 할당 해제 | MANAGER, ADMIN |
| DELETE | `/{id}` | 요청 삭제 | 작성자 또는 ADMIN |

### 회사 관리 (Companies) - `/api/companies`
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/` | 전체 회사 조회 | ADMIN |
| GET | `/{id}` | 회사 상세 조회 | ADMIN |
| POST | `/` | 회사 생성 | ADMIN |
| PUT | `/{id}` | 회사 수정 | ADMIN |
| DELETE | `/{id}` | 회사 삭제 | ADMIN |

### 프로젝트 관리 (Projects) - `/api/projects`
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/` | 전체 프로젝트 조회 | ADMIN, MANAGER |
| GET | `/{id}` | 프로젝트 상세 조회 | 인증된 사용자 |
| GET | `/company/{companyId}` | 회사별 프로젝트 조회 | 인증된 사용자 |
| POST | `/` | 프로젝트 생성 | ADMIN |
| PUT | `/{id}` | 프로젝트 수정 | ADMIN |
| DELETE | `/{id}` | 프로젝트 삭제 | ADMIN |

### 프로젝트 요청 (Project Requests) - `/api/project-requests`
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/` | 프로젝트 요청 목록 | CUSTOMER(본인), ADMIN(전체) |
| GET | `/{id}` | 요청 상세 조회 | 작성자 또는 ADMIN |
| POST | `/` | 프로젝트 신청 | CUSTOMER |
| PUT | `/{id}` | 대기 중인 요청 수정 | CUSTOMER (본인의 PENDING만) |
| POST | `/{id}/approve` | 요청 승인 (프로젝트 생성) | ADMIN |
| POST | `/{id}/reject` | 요청 거부 | ADMIN |
| DELETE | `/{id}` | 요청 삭제 | 작성자 또는 ADMIN |

## 데이터 모델

### User (사용자)
```json
{
  "id": 1,
  "userId": "hong123",           // 로그인 ID
  "username": "홍길동",           // 화면 표시명
  "email": "hong@example.com",
  "role": "ROLE_CUSTOMER",       // ROLE_ADMIN, ROLE_MANAGER, ROLE_CUSTOMER
  "companyId": 1,
  "companyName": "ABC Corp",
  "approvalStatus": "APPROVED",  // PENDING, APPROVED, REJECTED
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-01T10:00:00"
}
```

### Company (회사)
```json
{
  "id": 1,
  "companyName": "ABC Corporation",
  "companyCode": "ABC",
  "businessNumber": "123-45-67890",
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-01T10:00:00"
}
```

### Project (프로젝트)
```json
{
  "id": 1,
  "companyId": 1,
  "companyName": "ABC Corp",
  "projectName": "ERP 시스템 유지보수",
  "serviceType": "MAINTENANCE",     // MAINTENANCE, DEFECT_REPAIR
  "contractStartDate": "2024-01-01",
  "contractEndDate": "2024-12-31",
  "contractManDays": 240.0,
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-01T10:00:00"
}
```

### ServiceRequest (서비스 요청)
```json
{
  "id": 1,
  "title": "로그인 버튼 클릭 안됨",
  "description": "Chrome 브라우저에서 로그인 버튼 클릭 시 반응 없음",
  "status": "IN_PROGRESS",        // OPEN, IN_PROGRESS, RESOLVED, HOLD, CANCELLED
  "priority": "HIGH",             // LOW, MEDIUM, HIGH, URGENT
  "customerId": 5,
  "customerName": "홍길동",
  "managerId": 2,
  "managerName": "김매니저",
  "projectId": 1,
  "projectName": "ERP 시스템 유지보수",
  "hoursSpent": 3.5,
  "resolutionNotes": "이벤트 리스너 수정 완료",
  "dueDate": "20241225",
  "createdAt": "2024-11-20T09:00:00",
  "updatedAt": "2024-11-20T14:30:00",
  "resolvedAt": "2024-11-20T14:30:00"
}
```

### ProjectRequest (프로젝트 요청)
```json
{
  "id": 1,
  "requestedByUserId": 5,
  "requestedByUserName": "홍길동",
  "companyId": 1,
  "companyName": "ABC Corp",
  "projectName": "신규 웹사이트 구축",
  "serviceType": "MAINTENANCE",
  "contractStartDate": "2024-12-01",
  "contractEndDate": "2025-11-30",
  "contractManDays": 180.0,
  "requestStatus": "PENDING",     // PENDING, APPROVED, REJECTED
  "approvedByUserId": null,
  "approvedByUserName": null,
  "approvalNotes": null,
  "createdAt": "2024-11-20T10:00:00",
  "updatedAt": "2024-11-20T10:00:00"
}
```

### 열거형 (Enums)

#### 사용자 역할 (User.Role)
- `ROLE_ADMIN` - 관리자 (전체 시스템 관리)
- `ROLE_MANAGER` - 매니저 (서비스 요청 처리)
- `ROLE_CUSTOMER` - 고객 (서비스 요청 생성)

#### 승인 상태 (User.ApprovalStatus)
- `PENDING` - 승인 대기
- `APPROVED` - 승인됨
- `REJECTED` - 거부됨

#### 요청 상태 (ServiceRequest.RequestStatus)
- `OPEN` - 접수 (새로 생성됨)
- `IN_PROGRESS` - 진행중 (매니저가 처리 중)
- `RESOLVED` - 해결완료 (처리 완료)
- `HOLD` - 보류 (일시 중단)
- `CANCELLED` - 취소

#### 우선순위 (ServiceRequest.Priority)
- `LOW` - 낮음
- `MEDIUM` - 보통
- `HIGH` - 높음
- `URGENT` - 긴급

#### 서비스 유형 (Project.ServiceType)
- `MAINTENANCE` - 유지보수
- `DEFECT_REPAIR` - 장애수리

#### 프로젝트 요청 상태 (ProjectRequest.RequestStatus)
- `PENDING` - 승인 대기
- `APPROVED` - 승인됨 (프로젝트 생성됨)
- `REJECTED` - 거부됨

## 데이터베이스 스키마

### 주요 테이블

#### USERS (사용자)
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    company_id BIGINT REFERENCES companies(id),
    approval_status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### COMPANIES (회사)
```sql
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_code VARCHAR(50) UNIQUE NOT NULL,
    business_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### PROJECTS (프로젝트)
```sql
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id),
    project_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    contract_man_days NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### SERVICE_REQUESTS (서비스 요청)
```sql
CREATE TABLE service_requests (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    customer_id BIGINT NOT NULL REFERENCES users(id),
    manager_id BIGINT REFERENCES users(id),
    project_id BIGINT REFERENCES projects(id),
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    resolved_at TIMESTAMP,
    hours_spent DOUBLE PRECISION,
    resolution_notes TEXT,
    due_date VARCHAR(8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### PROJECT_REQUESTS (프로젝트 요청)
```sql
CREATE TABLE project_requests (
    id BIGSERIAL PRIMARY KEY,
    requested_by_user_id BIGINT NOT NULL REFERENCES users(id),
    company_id BIGINT NOT NULL REFERENCES companies(id),
    project_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    contract_man_days NUMERIC(10,2) NOT NULL,
    request_status VARCHAR(20) DEFAULT 'PENDING',
    approved_by_user_id BIGINT REFERENCES users(id),
    approval_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### USER_PROJECTS (사용자-프로젝트 매핑)
```sql
CREATE TABLE user_projects (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    project_id BIGINT NOT NULL REFERENCES projects(id),
    UNIQUE(user_id, project_id)
);
```

### 데이터 관계

```
COMPANIES (1) ──< (N) PROJECTS
COMPANIES (1) ──< (N) USERS
PROJECTS (N) ──< (N) USERS (through USER_PROJECTS)
PROJECTS (1) ──< (N) SERVICE_REQUESTS
USERS (CUSTOMER) (1) ──< (N) SERVICE_REQUESTS
USERS (MANAGER) (1) ──< (N) SERVICE_REQUESTS (assigned)
USERS (CUSTOMER) (1) ──< (N) PROJECT_REQUESTS
```

## 보안 및 인증

### JWT 인증 흐름

1. **로그인**:
   - 사용자가 userId와 password 전송
   - 서버가 BCrypt로 비밀번호 검증
   - 승인 상태(APPROVED) 확인
   - JWT 토큰 생성 (유효기간 24시간)
   - 토큰과 사용자 정보 반환

2. **API 요청**:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **토큰 검증**:
   - JwtAuthenticationFilter가 모든 요청 가로챔
   - 토큰에서 userId 추출
   - UserDetails 로드 및 인증 객체 생성
   - SecurityContext에 인증 정보 저장

### 권한 검증

메서드 레벨에서 `@PreAuthorize` 어노테이션 사용:

```java
@PreAuthorize("hasRole('ADMIN')")
public List<User> getAllUsers() { ... }

@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public List<Project> getAllProjects() { ... }

@PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
public ServiceRequest createServiceRequest() { ... }
```

### 비밀번호 보안

- **BCryptPasswordEncoder** 사용
- 기본 strength: 10
- Salt 자동 생성
- 단방향 암호화 (복호화 불가능)

### CORS 설정

```properties
allowed-origins: http://localhost:3000
allowed-methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
allowed-headers: *
allow-credentials: true
```

## 설정

### Backend 설정 (application.properties)

```properties
# 서버 포트
server.port=8080

# PostgreSQL 데이터베이스
spring.datasource.url=jdbc:postgresql://localhost:5432/customer_service
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.username=postgres
spring.datasource.password=postgres

# MyBatis 설정
mybatis.mapper-locations=classpath:mapper/**/*.xml
mybatis.type-aliases-package=com.example.customerservice.model
mybatis.configuration.map-underscore-to-camel-case=true
mybatis.configuration.log-impl=org.apache.ibatis.logging.stdout.StdOutImpl

# 스키마 및 데이터 초기화
spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:schema.sql
spring.sql.init.data-locations=classpath:data.sql
spring.sql.init.continue-on-error=true

# CORS
spring.web.cors.allowed-origins=http://localhost:3000
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS,PATCH
spring.web.cors.allowed-headers=*
spring.web.cors.allow-credentials=true

# JWT
jwt.secret=mySecretKeyForJWTTokenGenerationThatIsAtLeast256BitsLongForSecurity
jwt.expiration=86400000  # 24시간 (밀리초)
```

### Frontend 설정 (package.json)

```json
{
  "proxy": "http://localhost:8080",
  "dependencies": {
    "react": "^18.2.0",
    "@mui/material": "^7.3.5",
    "@mui/x-data-grid": "^8.18.0",
    "axios": "^1.6.0",
    "react-router-dom": "^6.x",
    "react-calendar": "^4.x",
    "xlsx": "^0.18.5"
  }
}
```

### Docker Compose 설정

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: customer-service-postgres
    environment:
      POSTGRES_DB: customer_service
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
```

## 개발 및 테스트

### 백엔드 테스트

```bash
cd backend
mvn test
```

### 프론트엔드 테스트

```bash
cd frontend
npm test
```

### 프로덕션 빌드

**백엔드:**
```bash
cd backend
mvn clean package
java -jar target/customer-service-0.0.1-SNAPSHOT.jar
```

**프론트엔드:**
```bash
cd frontend
npm run build
# build/ 디렉토리에 정적 파일 생성
```

## 문제 해결

### 데이터베이스 연결 오류

1. **PostgreSQL 컨테이너 상태 확인**:
   ```bash
   docker ps | grep postgres
   ```

2. **컨테이너 로그 확인**:
   ```bash
   docker logs customer-service-postgres
   ```

3. **PostgreSQL 재시작**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

4. **데이터베이스 완전 초기화** (모든 데이터 삭제):
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

5. **PostgreSQL 직접 접속**:
   ```bash
   docker exec -it customer-service-postgres psql -U postgres -d customer_service

   # 테이블 목록 확인
   \dt

   # 사용자 조회
   SELECT * FROM users;

   # 서비스 요청 조회
   SELECT * FROM service_requests;

   # 종료
   \q
   ```

### 백엔드 실행 오류

1. **포트 8080이 이미 사용 중**:
   ```bash
   # 사용 중인 프로세스 확인
   lsof -i :8080

   # 또는 application.properties에서 포트 변경
   server.port=8081
   ```

2. **Maven 빌드 오류**:
   ```bash
   # Maven 캐시 정리
   mvn clean

   # 의존성 다시 다운로드
   mvn clean install -U
   ```

3. **Java 버전 확인**:
   ```bash
   java -version
   # Java 17 이상 필요
   ```

### 프론트엔드 실행 오류

1. **포트 3000이 이미 사용 중**:
   ```bash
   # 포트 변경
   PORT=3001 npm start
   ```

2. **npm 의존성 오류**:
   ```bash
   # node_modules 삭제 후 재설치
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **API 연결 오류**:
   - 백엔드가 http://localhost:8080에서 실행 중인지 확인
   - 브라우저 콘솔에서 CORS 오류 확인
   - `api.js`의 API_BASE_URL 확인

### 인증 오류

1. **로그인 실패 (401 Unauthorized)**:
   - 사용자 승인 상태 확인 (APPROVED여야 함)
   - 비밀번호 확인
   - 데이터베이스에 사용자가 존재하는지 확인

2. **토큰 만료**:
   - 24시간 후 자동 만료
   - 다시 로그인 필요
   - localStorage에서 토큰 삭제: `localStorage.removeItem('token')`

3. **권한 없음 (403 Forbidden)**:
   - 역할(Role) 확인
   - 해당 API는 관리자 전용일 수 있음

### Excel 다운로드 오류

1. **다운로드가 시작되지 않음**:
   - 브라우저 팝업 차단 해제
   - 브라우저 콘솔에서 오류 메시지 확인

2. **한글 깨짐**:
   - Excel에서 UTF-8 인코딩 선택
   - 또는 Google Sheets에서 열기

## 프로덕션 배포 체크리스트

### 보안

- [ ] JWT 시크릿 키를 환경 변수로 변경
- [ ] 기본 admin 계정 비밀번호 변경
- [ ] PostgreSQL 비밀번호 변경
- [ ] CORS allowed-origins를 실제 도메인으로 제한
- [ ] HTTPS 설정
- [ ] 비밀번호 정책 강화 (최소 길이, 복잡도)

### 데이터베이스

- [ ] PostgreSQL를 별도 서버로 분리
- [ ] 데이터베이스 백업 정책 수립
- [ ] 커넥션 풀 최적화
- [ ] 인덱스 추가 (자주 조회되는 컬럼)

### 애플리케이션

- [ ] 프론트엔드 빌드 및 정적 파일 호스팅
- [ ] 백엔드 JAR 파일 생성 및 서비스 등록
- [ ] 로깅 설정 (파일 로그, 로그 레벨)
- [ ] 에러 핸들링 강화
- [ ] API 응답 시간 모니터링

### 인프라

- [ ] 리버스 프록시 설정 (Nginx, Apache)
- [ ] SSL/TLS 인증서 설치
- [ ] 방화벽 설정
- [ ] 서버 모니터링 (CPU, 메모리, 디스크)

## 라이선스

MIT License

## 기여하기

1. 저장소 포크 (Fork)
2. 기능 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시 (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 문의

프로젝트 관련 문의사항이나 버그 리포트는 GitHub Issues를 이용해주세요.

---

**개발 시작일**: 2024년
**최종 업데이트**: 2024년 11월
**버전**: 1.0.0
