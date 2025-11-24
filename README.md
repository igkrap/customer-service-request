# 고객 서비스 요청 관리 시스템

Spring Boot, React, PostgreSQL로 구축된 풀스택 서비스 요청 관리 애플리케이션입니다.

## 주요 기능

- 사용자 인증 및 권한 관리 (JWT 기반)
- 역할 기반 접근 제어 (관리자 및 일반 사용자)
- 사용자 관리 (관리자 전용 - 사용자 조회, 역할 수정, 삭제)
- 서비스 요청 관리 (CRUD 작업)
- 사용자별 서비스 요청 관리
- 요청 상태 추적 (접수, 진행중, 해결됨, 종료, 취소)
- 우선순위 설정 (낮음, 보통, 높음, 긴급)
- RESTful API (Spring Boot)
- 현대적인 React UI
- PostgreSQL 데이터베이스

## 기술 스택

### 백엔드
- Java 17
- Spring Boot 3.2.0
- Spring Security (JWT 인증)
- MyBatis 3.0.3
- PostgreSQL 16
- Maven

### 프론트엔드
- React 18
- Axios (API 통신)
- 모던 CSS 스타일링

### 데이터베이스
- PostgreSQL 16

## 프로젝트 구조

```
customer-service-request/
├── backend/                    # Spring Boot 백엔드
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/customerservice/
│   │   │   │   ├── controller/    # REST 컨트롤러
│   │   │   │   ├── service/       # 비즈니스 로직
│   │   │   │   ├── mapper/        # MyBatis 매퍼 인터페이스
│   │   │   │   ├── model/         # 도메인 모델 클래스
│   │   │   │   ├── dto/           # 데이터 전송 객체
│   │   │   │   └── config/        # 설정 클래스
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       ├── schema.sql     # 데이터베이스 스키마
│   │   │       └── data.sql       # 초기 데이터
│   │   └── test/
│   └── pom.xml
├── frontend/                   # React 프론트엔드
│   ├── public/
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   ├── services/          # API 서비스 레이어
│   │   └── styles/            # CSS 파일
│   └── package.json
└── docker-compose.yml         # Docker 구성
```

## 사전 요구사항

- Java 17 이상
- Maven 3.6+
- Node.js 16+ 및 npm
- Docker 및 Docker Compose (PostgreSQL 실행용)

## 설치 및 실행 방법

### 1. 데이터베이스 설정

Docker를 사용하여 PostgreSQL을 실행합니다:

```bash
docker-compose up -d
```

PostgreSQL이 `localhost:5432`에서 실행되며, 데이터베이스 `customer_service`가 자동으로 생성됩니다.

**데이터베이스 정보:**
- 호스트: localhost
- 포트: 5432
- 데이터베이스: customer_service
- 사용자명: postgres
- 비밀번호: postgres

### 2. 백엔드 설정 및 실행

백엔드 디렉토리로 이동하여 실행:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

백엔드 서버가 `http://localhost:8080`에서 시작됩니다.

애플리케이션 시작 시 자동으로 스키마가 생성되고 기본 관리자 계정이 추가됩니다.

**기본 관리자 계정:**
- 사용자명: `admin`
- 비밀번호: `1234`
- 역할: `ROLE_ADMIN`

**중요:** 보안을 위해 첫 로그인 후 관리자 비밀번호를 변경하세요.

### 3. 프론트엔드 설정 및 실행

프론트엔드 디렉토리로 이동하여 실행:

```bash
cd frontend
npm install
npm start
```

React 애플리케이션이 `http://localhost:3000`에서 시작됩니다.

## 사용 매뉴얼

### 1. 첫 시작하기

1. **데이터베이스 실행**
   ```bash
   docker-compose up -d
   ```

2. **백엔드 서버 실행**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. **프론트엔드 실행**
   ```bash
   cd frontend
   npm start
   ```

4. **브라우저에서 접속**
   - `http://localhost:3000` 접속

### 2. 로그인 및 회원가입

#### 관리자로 로그인
1. 로그인 페이지에서 기본 관리자 계정으로 로그인
   - 사용자명: `admin`
   - 비밀번호: `1234`

#### 새 사용자 회원가입
1. 로그인 페이지에서 "회원가입" 클릭
2. 사용자명, 이메일, 비밀번호 입력
3. 회원가입 완료 후 자동으로 로그인됨
4. 기본적으로 `ROLE_USER` 권한 부여

### 3. 서비스 요청 관리 (일반 사용자)

#### 서비스 요청 생성
1. 로그인 후 "새 요청 등록" 버튼 클릭
2. 요청 정보 입력:
   - 제목: 요청의 간단한 제목
   - 설명: 상세한 문제 설명
   - 우선순위: 낮음/보통/높음/긴급 선택
3. "등록" 버튼 클릭

#### 내 요청 조회
1. 대시보드에서 자신이 생성한 모든 요청 확인
2. 상태별, 우선순위별 필터링 가능
3. 요청 클릭 시 상세 정보 확인

#### 서비스 요청 수정
1. 요청 목록에서 수정할 요청 선택
2. "수정" 버튼 클릭
3. 필요한 정보 수정
4. "저장" 버튼 클릭

#### 서비스 요청 삭제
1. 요청 목록에서 삭제할 요청 선택
2. "삭제" 버튼 클릭
3. 확인 메시지에서 "확인" 클릭

### 4. 관리자 기능

#### 모든 서비스 요청 관리
- 관리자는 모든 사용자의 요청을 조회하고 관리할 수 있습니다
- 요청 상태 변경 가능:
  - 접수 (OPEN)
  - 진행중 (IN_PROGRESS)
  - 해결됨 (RESOLVED)
  - 종료 (CLOSED)
  - 취소 (CANCELLED)

#### 사용자 관리
1. "사용자 관리" 메뉴 클릭
2. 전체 사용자 목록 확인
3. 사용자 역할 변경:
   - 사용자 선택
   - "역할 변경" 버튼 클릭
   - ROLE_USER 또는 ROLE_ADMIN 선택
4. 사용자 삭제:
   - 사용자 선택
   - "삭제" 버튼 클릭
   - 확인 메시지에서 "확인" 클릭

### 5. 대시보드 활용

#### 상태별 필터링
- "모두", "접수", "진행중", "해결됨", "종료", "취소" 탭으로 요청 필터링

#### 우선순위별 필터링
- 우선순위 필터를 사용하여 긴급도가 높은 요청 우선 확인

#### 검색 기능
- 제목, 설명으로 요청 검색 가능

### 6. 월간 리포트 (관리자)

관리자는 월별 서비스 요청 통계를 확인할 수 있습니다:
- 담당자별 처리 현황
- 월별 요청 건수
- 상태별 통계
- Excel 파일로 다운로드 가능

## API 엔드포인트

### 인증 엔드포인트

- `POST /api/auth/signup` - 새 사용자 회원가입 (공개)
- `POST /api/auth/login` - 로그인 및 JWT 토큰 발급 (공개)

### 사용자 관리 엔드포인트 (관리자 전용)

- `GET /api/users` - 모든 사용자 조회
- `GET /api/users/{id}` - ID로 사용자 조회
- `PUT /api/users/{id}/role` - 사용자 역할 수정
- `DELETE /api/users/{id}` - 사용자 삭제

### 서비스 요청 엔드포인트 (사용자 및 관리자)

- `GET /api/service-requests` - 모든 서비스 요청 조회 (관리자는 전체, 사용자는 자신의 요청만)
- `GET /api/service-requests/{id}` - ID로 요청 조회
- `GET /api/service-requests/user/{userId}` - 사용자별 요청 조회
- `GET /api/service-requests/status/{status}` - 상태별 요청 조회
- `GET /api/service-requests/priority/{priority}` - 우선순위별 요청 조회
- `POST /api/service-requests` - 새 요청 생성
- `PUT /api/service-requests/{id}` - 요청 수정
- `DELETE /api/service-requests/{id}` - 요청 삭제

## 데이터 모델

### 사용자 (User)
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "ROLE_USER",
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-01T10:00:00"
}
```

### 회원가입 요청
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

### 로그인 요청
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

### 인증 응답
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "ROLE_USER"
}
```

### 서비스 요청 (Service Request)
```json
{
  "id": 1,
  "title": "제품 문제",
  "description": "상세한 문제 설명",
  "status": "OPEN",
  "priority": "HIGH",
  "userId": 1,
  "userName": "johndoe",
  "userEmail": "john@example.com",
  "assignedTo": "지원팀",
  "createdByUserId": 1,
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-01T10:00:00",
  "resolvedAt": null
}
```

### 상태 값
- `OPEN` - 접수
- `IN_PROGRESS` - 진행중
- `RESOLVED` - 해결됨
- `CLOSED` - 종료
- `CANCELLED` - 취소

### 우선순위 값
- `LOW` - 낮음
- `MEDIUM` - 보통
- `HIGH` - 높음
- `URGENT` - 긴급

### 사용자 역할
- `ROLE_USER` - 서비스 요청 관리 권한을 가진 일반 사용자
- `ROLE_ADMIN` - 사용자 관리를 포함한 모든 기능에 대한 전체 접근 권한을 가진 관리자

## 인증 방식

API는 JWT (JSON Web Token)를 사용하여 인증합니다. 보호된 엔드포인트에 접근하려면:

1. **회원가입** 또는 **로그인**하여 JWT 토큰을 받습니다
2. 요청 시 `Authorization` 헤더에 토큰을 포함합니다:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

### 사용 예시

```bash
# 1. 기본 관리자 계정으로 로그인
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'

# 응답에 JWT 토큰 포함됨
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","type":"Bearer",...}

# 2. 새 사용자 회원가입
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","email":"john@example.com","password":"password123"}'

# 3. 토큰을 사용하여 보호된 엔드포인트 접근
curl -X GET http://localhost:8080/api/service-requests \
  -H "Authorization: Bearer <your-jwt-token>"

# 4. 관리자: 사용자 역할 관리
curl -X PUT http://localhost:8080/api/users/2/role \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"ROLE_ADMIN"}'
```

### 접근 제어

- **공개 엔드포인트**: `/api/auth/signup`, `/api/auth/login`
- **사용자 및 관리자**: `/api/service-requests/**` (사용자는 자신의 요청만 조회/수정 가능)
- **관리자 전용**: `/api/users/**` (모든 서비스 요청에 대한 전체 접근)

## 설정

### 데이터베이스 연결

데이터베이스는 `backend/src/main/resources/application.properties`에서 설정됩니다:

```properties
# 데이터베이스 설정
spring.datasource.url=jdbc:postgresql://localhost:5432/customer_service
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.username=postgres
spring.datasource.password=postgres

# MyBatis 설정
mybatis.mapper-locations=classpath:mapper/**/*.xml
mybatis.type-aliases-package=com.example.customerservice.model
mybatis.configuration.map-underscore-to-camel-case=true
```

애플리케이션 시작 시 `schema.sql`과 `data.sql`이 자동으로 실행되어 데이터베이스 스키마와 초기 데이터가 생성됩니다.

### MyBatis 매퍼

이 프로젝트는 어노테이션 기반 SQL 매핑과 함께 MyBatis를 사용합니다. 매퍼 인터페이스는 `mapper` 패키지에 있습니다:
- `UserMapper.java` - 사용자 CRUD 작업
- `ServiceRequestMapper.java` - 서비스 요청 CRUD 작업

SQL 쿼리는 매퍼 인터페이스 메서드에 `@Select`, `@Insert`, `@Update`, `@Delete` 어노테이션을 사용하여 정의됩니다.

### CORS 설정

백엔드는 `http://localhost:3000`에서의 요청을 허용하도록 설정되어 있습니다. 허용된 출처를 변경하려면 `application.properties`를 수정하세요.

## 개발

### 테스트 실행

백엔드 테스트:
```bash
cd backend
mvn test
```

프론트엔드 테스트:
```bash
cd frontend
npm test
```

### 프로덕션 빌드

백엔드:
```bash
cd backend
mvn clean package
java -jar target/customer-service-0.0.1-SNAPSHOT.jar
```

프론트엔드:
```bash
cd frontend
npm run build
```

## 문제 해결

### 데이터베이스 이슈

1. PostgreSQL 컨테이너가 실행 중인지 확인:
```bash
docker ps
```

2. PostgreSQL 재시작:
```bash
docker-compose down
docker-compose up -d
```

3. 데이터베이스 초기화가 필요한 경우:
```bash
docker-compose down -v  # 볼륨 삭제
docker-compose up -d
```

4. PostgreSQL 직접 접속:
```bash
docker exec -it customer-service-postgres psql -U postgres -d customer_service
\dt                                    # 테이블 목록
SELECT * FROM users;                   # 사용자 조회
SELECT * FROM service_requests;        # 서비스 요청 조회
\q                                     # 종료
```

### 포트 충돌

포트 8080 또는 3000이 이미 사용 중인 경우:
- 백엔드 포트: `application.properties`의 `server.port` 수정
- 프론트엔드 포트: `PORT` 환경 변수 설정

### 연결 오류

1. 백엔드가 실행 중인지 확인:
```bash
curl http://localhost:8080/api/auth/login
```

2. PostgreSQL이 실행 중인지 확인:
```bash
docker ps | grep postgres
```

3. 프론트엔드가 올바른 API URL을 사용하는지 확인

## 보안 참고사항

- PostgreSQL은 프로덕션 환경에 적합합니다
- 프로덕션 배포 시 강력한 비밀번호 사용
- JWT 시크릿 키를 환경 변수로 관리
- HTTPS 사용 권장
- 정기적인 보안 업데이트 적용

## 라이선스

MIT License

## 기여하기

1. 저장소 포크
2. 기능 브랜치 생성
3. 변경사항 커밋
4. 브랜치에 푸시
5. Pull Request 생성
