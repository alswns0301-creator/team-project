# 🚗 NeighborCar (이웃 기반 P2P 카셰어링 플랫폼)

> **Node.js & TypeScript** 기반의 안전하고 투명한 이웃 간 차량 공유(P2P Car Sharing) 서비스 백엔드 시스템입니다.  
> GPS 기반 동네 인증, 공공 API를 통한 면허·차적 검증, 원데이 자동차보험 연동, AI 비전 기반 차량 흠집 비교 및 계기판 OCR 정산 기능을 제공합니다.

---

## 📋 목차
1. [프로젝트 소개](#-프로젝트-소개)
2. [기술 스택 (Tech Stack)](#-기술-스택-tech-stack)
3. [핵심 기능 명세 (Core Features)](#-핵심-기능-명세-core-features)
4. [시스템 아키텍처 (System Architecture)](#-시스템-아키텍처-system-architecture)
5. [데이터베이스 모델링 (ERD / Prisma Schema)](#-데이터베이스-모델링-erd--prisma-schema)
6. [프로젝트 디렉토리 구조](#-프로젝트-디렉토리-구조)
7. [주요 API 명세 (API Endpoints)](#-주요-api-명세-api-endpoints)
8. [시작하기 (Getting Started)](#-시작하기-getting-started)
9. [환경 변수 설정 (.env)](#-환경-변수-설정-env)

---

## 💡 프로젝트 소개

**NeighborCar**는 유휴 차량을 소유한 호스트와 이동 수단이 필요한 같은 동네 게스트를 연결하는 P2P 카셰어링 플랫폼입니다.  
기존 렌터카의 번거로움과 쏘카/그린카의 주차존 제한을 넘어, **실제 거주 이웃 간의 신뢰**를 기반으로 운영됩니다.

- **안전성:** 공공데이터 연동(운전면허 진위/차적 검증) + 원데이 자동차보험 자동 가입
- **분쟁 제로:** AI 컴퓨터 비전 모델을 이용한 차량 전/후 손상 자동 비교 리포트
- **투명한 정산:** 계기판 촬영 한 번으로 주행거리를 자동 인식(OCR)하여 2단계 결제 수행

---

## 🛠 기술 스택 (Tech Stack)

### Backend Runtime & Framework
- **Runtime:** Node.js (v20+ LTS)
- **Language:** TypeScript (v5.x)
- **Framework:** NestJS (또는 Express + TypeScript)
- **ORM:** Prisma ORM (또는 TypeORM)
- **Database:** PostgreSQL (with PostGIS for Geo-queries)
- **In-Memory Cache & Pub/Sub:** Redis (세션 캐싱, GPS 인덱싱, Socket.io 어댑터)

### Real-Time & Communications
- **WebSockets:** Socket.io (NestJS Gateway) - 1:1 채팅, 실시간 상태 변경 알림
- **Push Notification:** Firebase Cloud Messaging (FCM) / 카카오 알림톡 API

### AI & Computer Vision Integration
- **Vision AI / Multimodal:** Google Gemini 1.5 Pro / Flash Vision API (차량 외관 손상 검출, 스크래치 비교, A~D 등급 분류)
- **OCR:** Google Cloud Vision OCR / Gemini Vision (계기판 주행거리 km 자동 추출)

### External APIs & Payments
- **본인인증:** 다날 / NICE 휴대폰 본인확인 API
- **면허/차적 검증:** 도로교통공단 운전면허 진위확인 API, 국토교통부 자동차종합정보(차적 조회) API
- **지도/위치:** Kakao Mobility API / Naver Cloud Platform Maps (Reverse Geocoding & 거리 계산)
- **결제/정산:** 토스페이먼츠(Toss Payments) / 포트원(PortOne) 빌링 자동결제 (1차 선결제 + 2차 계기판 정산 후결제)
- **보험:** 원데이 자동차보험 연동 API (현대해상/DB손해보험/하나손해보험 등)

---

## 🚀 핵심 기능 명세 (Core Features)

### 1. 회원가입 및 마이페이지 (사용자 계정 관리)
- **하이브리드 역할(Role) 아키텍처:**
  - 최초 회원가입 시 `HOST` 또는 `GUEST` 역할을 선택하며, 마이페이지에서 자유롭게 전환 및 겸업 가능(`USER` 단일 테이블에 역할 플래그/프로필 연동).
- **계정 및 프로필 관리:**
  - 이메일/비밀번호(Argon2/Bcrypt 암호화), 전화번호, 닉네임, 프로필 이미지 업로드(AWS S3/GCS Pre-signed URL).
- **마이페이지 통합 대시보드:**
  - 등록 면허증 조회/재인증 관리.
  - 결제 수단 등록/삭제(게스트용 빌링키 발급) 및 정산 계좌 관리(호스트용 예금주 실명조회).
  - 호스트 차량 등록/수정 및 대여 가능 스케줄러(캘린더 시간 블록) 설정.
  - 과거/현재 이용 내역 및 체결된 원데이 보험증권 PDF/상세 조회.

---

### 2. 본인인증 시스템 (4단계 검증 파이프라인)
- **휴대폰 본인인증:** NICE/다날 본인확인 모듈 연동 (실명, 생년월일, 성별, 중복가입확인정보 CI/DI 저장).
- **운전면허 자격 검증:**
  - 면허종별, 면허번호, 발급일자, 식별번호 입력.
  - 경찰청/도로교통공단 API 실시간 연동을 통한 면허 정지/취소/유효성 자동 판정.
- **GPS 기반 동네 인증 (Neighbor Verification):**
  - 단말기 위도/경도(GPS) 좌표 수신 → 카카오/네이버 Reverse Geocoding API를 통해 행정동/법정동 단위 매핑.
  - 30일 주기로 재인증 요청하여 실제 동네 이웃 간 거래 유도.
- **차량 소유권 인증 (호스트 전용):**
  - 소유자명 + 차량등록번호 입력 → 국토교통부 차적 조회 공공 API 연동.
  - 차량 실소유 여부, 압류/저당 여부, 차종/연식 자동 검증.

---

### 3. 카테고리 태그 및 상세 필터 검색
- **태그 기반 인덱싱:**
  - **차종 태그:** `#소형`, `#준중형`, `#중형`, `#대형`, `#SUV`, `#전기차`, `#수입차`, `#승합`
  - **옵션/특징 태그:** `#차박가능`, `#애완동물동반`, `#금연차량`, `#후방카메라`, `#카시트유`, `#하이패스`
- **복합 필터링 쿼리 (Prisma / PostGIS):**
  - 시간당 대여료 슬라이더 범위 필터 (`minPrice` ~ `maxPrice`).
  - AI 차량 등급 필터 (`GRADE_A`, `GRADE_B`, `GRADE_C`, `GRADE_D`).
  - 대여 희망 일시 및 시간대 가용 여부 스케줄 필터.
  - 인증된 동네 기준 반경 검색(1km, 3km, 5km).

---

### 4. GPS 기반 탐색, 예약, 보험 및 AI OCR 2단계 결제/정산 시스템
- **위치 기반 실시간 탐색:**
  - PostGIS `ST_DWithin` 또는 Redis GEO를 활용하여 사용자의 단발성 GPS 기준 반경 내 대여 가능한 차량 핀(Pin) 지도 노출.
- **차량 상세 정보:**
  - 차량 고화질 사진, 호스트 매너온도, AI 외관 등급, 시간당 대여료, km당 주행요금, 실사용자 후기.
- **원데이 자동차보험 자동 청약:**
  - 대여 시작 ~ 반납 시간 기준 자차, 대인, 대물, 자기신체사고(자상) 보장 플랜 선택.
  - 보험사 API 비동기 호출을 통한 가입 승인 및 증권번호 발급.
- **2단계 결제 및 AI 계기판 OCR 정산 파이프라인:**
  1. **1차 선결제 (대여 확정 시점):**
     - `대여료(시간 기준) + 원데이 보험료` 선결제 진행.
     - 결제 완료 즉시 보험 효력 개시 및 스마트 키/열쇠 전달 절차 안내.
  2. **2차 후결제 (차량 반납 시점):**
     - 인수 전/반납 후 계기판 계측 사진 업로드.
     - **AI Multimodal Vision / OCR** 엔진이 두 사진에서 누적 주행거리(Odometer km) 수치 추출.
     - `(반납 시 주행거리 - 대여 시 주행거리) × km당 주행 단가` 자동 산출.
     - 등록된 빌링키(카드)로 2차 주행요금 자동 승인 및 결제 영수증 발행.

---

### 5. 호스트 - 게스트 간 채팅 및 실시간 알림 시스템
- **1:1 전용 인앱 채팅방:**
  - 예약 확정(`CONFIRMED`) 시 Socket.io 기반 전용 룸(Room) 자동 생성.
  - 차량 인수인계 장소 협의, 추가 사진 전송, 외부 메신저/연락처 공유 방지 필터링(전화번호/계좌번호 마스킹).
- **24시간 긴급 사고 접수 모듈:**
  - 채팅방 및 대여 화면 상단 '긴급 사고 접수' 버튼 상시 배치.
  - 사고 위치(GPS), 접촉 부위 사진 등록 시 즉시 보험사 긴급출동 및 24시간 CS 관제 연동.
- **통합 알림 센터 (FCM & In-App Notification):**
  - 예약 상태 변경(예약 승인, 차량 인수 30분 전, 반납 마감 15분 전 안내).
  - 정산 완료 영수증 알림, 신규 손상 발견 리포트 푸시 전송.
  - 사용자 알림 설정(필수 서비스 알림, 마케팅 알림, 야간 방해금지 시간대) 개별 제어.

---

### 6. AI 비전 기반 차량 외관 분석 및 스크래치 비교 시스템
- **최초 등록 시 AI 외관 등급 판정 (A~D 등급):**
  - 호스트가 차량 전면/후면/좌우 4방향 고해상도 사진 업로드.
  - AI 모델이 미세 스크래치, 덴트(문콕), 범퍼 찌그러짐을 종합 분석하여 외관 결함 스코어링 → **A/B/C/D 등급 자동 산정**.
- **대여 전/후 신규 손상 비교 (Scratch Diff Engine):**
  - **인수 전 촬영:** 게스트가 차량 4방면 사진 업로드 (기준 이미지 생성).
  - **반납 시 촬영:** 게스트가 동일 각도 4방면 사진 업로드.
  - **AI 시각 탐지:** 대여 전/후 이미지를 정합(Alignment)하여 신규 발생한 흠집 및 파손 부위 바운딩 박스/하이라이트 처리.
  - 신규 손상 감지 시 타임스탬프와 메타데이터가 담긴 **'차량 상태 비교 리포트'** 자동 생성 및 양측 발송.

---

### 7. 호스트 - 게스트 간 매너 평가 시스템 (매너온도)
- **상호 신뢰 평가:**
  - 거래 완료 후 5점 만점 별점 및 추천/비추천 키워드 태그(예: `#시간약속을_잘지켜요`, `#차량이_청결해요`, `#친절하고_매너있어요`).
- **매너온도 산정 알고리즘:**
  - 기본 **36.5℃**에서 시작.
  - 긍정 피드백(+0.1℃ ~ +0.5℃), 부정 피드백(-0.2℃ ~ -1.0℃), 노쇼/규정 위반 시 패널티(-3.0℃) 가중치 적용.
  - 프로필 및 차량 카드에 온도 뱃지 노출(온도별 아이콘 및 신뢰도 등급 표현).

---

### 8. AI Dynamic 요금 추천 및 호스트 수익 대시보드
- **AI Dynamic Pricing Engine:**
  - 지역별 실시간 수요/공급 데이터, 주말/공휴일 특수, 실시간 날씨(우천/강설), 차량 감가상각률, 오피넷(Opinet) 유가 동향을 종합 분석.
  - 호스트에게 시간당 최적 대여료 및 km당 적정 주행요금 가이드라인 실시간 추천.
- **호스트 수익 및 통계 대시보드:**
  - 일간/주간/월간 정산 내역 및 플랫폼 수수료 공제 후 실입금 예정액 차트 제공.
  - 머신러닝 기반 다음 달 예상 수익 예측치 및 가동률 향상(가격 조정, 예약 가능 시간 확대) 팁 제공.

---

## 🏗 시스템 아키텍처 (System Architecture)

```mermaid
flowchart TD
    subgraph Client["클라이언트 (Web / Mobile App)"]
        User["게스트 / 호스트"]
    end

    subgraph Gateway["API Gateway / NestJS App"]
        AuthModule["인증 모듈 (Auth / JWT / Passport)"]
        CarModule["차량 & 검색 모듈 (Geo / PostGIS)"]
        ReservationModule["예약 & 보험 모듈"]
        PaymentModule["2단계 결제 & 정산 모듈"]
        ChatGateway["실시간 채팅 게이트웨이 (Socket.io)"]
        AIModule["AI 비전 & OCR 서비스"]
    end

    subgraph ExternalServices["외부 연동 서비스"]
        NICE["NICE/다날 본인인증"]
        KOTSA["도로교통공단/경찰청 면허검증"]
        MOLIT["국토교통부 차적 조회"]
        MapsAPI["카카오/네이버 지도 & Reverse Geocoding"]
        InsuranceAPI["원데이 자동차보험 API"]
        PG["토스페이먼츠 (선결제/빌링 자동결제)"]
        VisionAI["Gemini Vision / Cloud Vision (OCR & 외관분석)"]
        FCM["Firebase Cloud Messaging (FCM)"]
    end

    subgraph DataStorage["데이터베이스 & 캐시"]
        PostgreSQL[("PostgreSQL + PostGIS")]
        Redis[("Redis (캐시, 세션, Socket.io Pub/Sub)")]
        S3[("AWS S3 (차량 사진, 손상 리포트)")]
    end

    User -->|REST / WebSocket| Gateway
    AuthModule --> NICE
    AuthModule --> KOTSA
    CarModule --> MOLIT
    CarModule --> MapsAPI
    CarModule --> PostgreSQL
    ReservationModule --> InsuranceAPI
    PaymentModule --> PG
    AIModule --> VisionAI
    AIModule --> S3
    ChatGateway --> Redis
    Gateway --> FCM
    Gateway --> PostgreSQL
```

---

## 🗄 데이터베이스 모델링 (Prisma Schema 예시)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  GUEST
  HOST
  BOTH
}

enum CarGrade {
  GRADE_A
  GRADE_B
  GRADE_C
  GRADE_D
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  ACTIVE
  RETURNED
  SETTLED
  CANCELLED
}

model User {
  id                String            @id @default(uuid())
  email             String            @unique
  passwordHash      String
  phoneNumber       String            @unique
  nickname          String            @unique
  profileImageUrl   String?
  role              Role              @default(GUEST)
  mannerTemperature Float             @default(36.5)
  isIdentityVerified Boolean          @default(false)
  verifiedDistrict  String?           // 인증된 행정동
  lastDistrictAuthAt DateTime?
  
  driverLicense     DriverLicense?
  billingKey        BillingKey?
  settlementAccount SettlementAccount?
  cars              Car[]
  reservations      Reservation[]     @relation("GuestReservations")
  chatMessages      ChatMessage[]
  mannerReviewsGiven  MannerReview[]  @relation("ReviewsGiven")
  mannerReviewsReceived MannerReview[] @relation("ReviewsReceived")
  
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}

model DriverLicense {
  id              String    @id @default(uuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  licenseNumber   String    @unique
  birthDate       String
  issueDate       String
  serialNumber    String
  isValidated     Boolean   @default(false)
  validatedAt     DateTime?
}

model Car {
  id              String            @id @default(uuid())
  hostId          String
  host            User              @relation(fields: [hostId], references: [id])
  carNumber       String            @unique
  modelName       String
  carType         String            // 소형, 준중형, SUV 등
  hourlyRate      Int
  ratePerKm       Int
  aiGrade         CarGrade          @default(GRADE_B)
  latitude        Float
  longitude       Float
  locationAddress String
  tags            String[]          // #차박가능, #금연차량 등
  images          String[]
  isAvailable     Boolean           @default(true)
  reservations    Reservation[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

model Reservation {
  id                String            @id @default(uuid())
  carId             String
  car               Car               @relation(fields: [carId], references: [id])
  guestId           String
  guest             User              @relation("GuestReservations", fields: [guestId], references: [id])
  startTime         DateTime
  endTime           DateTime
  status            ReservationStatus @default(PENDING)
  
  // 1차 선결제 내역 (대여료 + 보험료)
  baseRentalFee     Int
  insuranceFee      Int
  insurancePolicyNo String?
  firstPaymentId    String?
  
  // 계기판 OCR & 2차 정산 내역
  startOdometer     Int?
  endOdometer       Int?
  startDashboardImg String?
  endDashboardImg   String?
  distanceFee       Int?
  secondPaymentId   String?
  
  chatRoom          ChatRoom?
  damageReports     DamageReport[]
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}

model ChatRoom {
  id              String            @id @default(uuid())
  reservationId   String            @unique
  reservation     Reservation       @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  messages        ChatMessage[]
  createdAt       DateTime          @default(now())
}

model ChatMessage {
  id         String   @id @default(uuid())
  chatRoomId String
  chatRoom   ChatRoom @relation(fields: [chatRoomId], references: [id], onDelete: Cascade)
  senderId   String
  sender     User     @relation(fields: [senderId], references: [id])
  message    String
  imageUrl   String?
  isSystem   Boolean  @default(false)
  createdAt  DateTime @default(now())
}

model DamageReport {
  id              String      @id @default(uuid())
  reservationId   String
  reservation     Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  beforeImages    String[]
  afterImages     String[]
  diffReportJson  Json        // AI 감지 신규 흠집 좌표 및 설명
  hasNewDamage    Boolean     @default(false)
  createdAt       DateTime    @default(now())
}

model MannerReview {
  id          String   @id @default(uuid())
  reviewerId  String
  reviewer    User     @relation("ReviewsGiven", fields: [reviewerId], references: [id])
  targetUserId String
  targetUser  User     @relation("ReviewsReceived", fields: [targetUserId], references: [id])
  score       Int      // 1 ~ 5
  tags        String[]
  comment     String?
  tempDelta   Float    // 매너온도 변동분
  createdAt   DateTime @default(now())
}

model BillingKey {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  billingKey  String
  cardCompany String
  cardNumberMasked String
  createdAt   DateTime @default(now())
}

model SettlementAccount {
  id            String   @id @default(uuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  bankName      String
  accountNumber String
  holderName    String
  isVerified    Boolean  @default(false)
  createdAt     DateTime @default(now())
}
```

---

## 📁 프로젝트 디렉토리 구조

```plaintext
neighbor-car-backend/
├── src/
│   ├── app.module.ts                   # 루트 모듈
│   ├── main.ts                         # 엔트리포인트 (NestJS Bootstrap)
│   ├── common/                         # 공통 유틸리티, 인터셉터, 필터, 가드
│   │   ├── decorators/                 # @CurrentUser, @Roles 등
│   │   ├── filters/                    # HttpExceptionsFilter
│   │   ├── guards/                     # JwtAuthGuard, RolesGuard
│   │   └── interceptors/               # Logging, TransformResponse
│   ├── config/                         # 환경변수 로더 (Joi/ConfigModule)
│   ├── modules/
│   │   ├── auth/                       # 인증, 회원가입, JWT, 비밀번호 암호화
│   │   ├── verification/               # 본인인증, 면허 검증, 동네 GPS 인증, 차적 조회
│   │   │   ├── services/
│   │   │   │   ├── nice-identity.service.ts
│   │   │   │   ├── kotsa-license.service.ts
│   │   │   │   ├── molit-car.service.ts
│   │   │   │   └── district-auth.service.ts
│   │   ├── cars/                       # 차량 등록, 위치 기반 반경 검색, 태그 필터
│   │   │   └── dto/
│   │   ├── reservations/               # 예약 생성, 일정 검증, 취소
│   │   ├── insurance/                  # 원데이 자동차보험 청약 및 연동
│   │   ├── payments/                   # 토스페이먼츠 1차 선결제, 2차 정산 후결제
│   │   ├── chat/                       # 1:1 채팅방 및 실시간 웹소켓(Gateway)
│   │   │   ├── chat.gateway.ts
│   │   │   └── chat.service.ts
│   │   ├── notifications/              # FCM 푸시 및 인앱 알림
│   │   ├── ai-vision/                  # AI 손상 분석 및 계기판 OCR
│   │   │   ├── services/
│   │   │   │   ├── gemini-vision.service.ts     # 차량 등급 판정 & 흠집 비교
│   │   │   │   └── dashboard-ocr.service.ts     # 계기판 주행거리 추출
│   │   ├── reviews/                    # 매너온도 계산 및 상호 평가
│   │   └── host-dashboard/             # Dynamic 요금 추천 및 수익 통계
│   └── prisma/                         # Prisma 서비스 & 클라이언트
├── prisma/
│   └── schema.prisma                   # 데이터베이스 스키마 정의
├── test/                               # E2E 및 단위 테스트
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔌 주요 API 명세 (API Endpoints)

### 1. 인증 및 사용자 관리 (`/api/v1/auth`, `/api/v1/users`)
| Method | Endpoint | 설명 |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/signup` | 신규 회원가입 (게스트/호스트 기본 역할 지정) |
| `POST` | `/api/v1/auth/login` | 이메일/비밀번호 로그인 및 JWT 발급 |
| `GET` | `/api/v1/users/me` | 내 프로필 정보 및 매너온도 조회 |
| `PATCH`| `/api/v1/users/role` | 역할 전환 (게스트 <-> 호스트) |

### 2. 본인인증 & 공공 API 검증 (`/api/v1/verification`)
| Method | Endpoint | 설명 |
| :--- | :--- | :--- |
| `POST` | `/api/v1/verification/phone` | NICE/다날 본인인증 완료 토큰 검증 |
| `POST` | `/api/v1/verification/driver-license` | 경찰청/도로교통공단 면허 진위 확인 |
| `POST` | `/api/v1/verification/district` | GPS 좌표 기반 행정동 동네 인증 |
| `POST` | `/api/v1/verification/car-ownership` | 국토부 차적 조회를 통한 차량 소유권 검증 |

### 3. 차량 탐색 및 등록 (`/api/v1/cars`)
| Method | Endpoint | 설명 |
| :--- | :--- | :--- |
| `GET` | `/api/v1/cars/search` | GPS 반경 내 차량 핀 검색 (태그, 가격, AI 등급 필터) |
| `GET` | `/api/v1/cars/:id` | 차량 상세 정보 및 호스트 매너온도 조회 |
| `POST` | `/api/v1/cars` | 호스트 신규 차량 등록 (AI 등급 평가 요청) |
| `PATCH`| `/api/v1/cars/:id/schedule` | 대여 가능 시간대 설정 |

### 4. 예약, 보험 및 2단계 결제 (`/api/v1/reservations`, `/api/v1/payments`)
| Method | Endpoint | 설명 |
| :--- | :--- | :--- |
| `POST` | `/api/v1/reservations` | 차량 예약 생성 및 원데이 보험 가입 요청 |
| `POST` | `/api/v1/payments/first-charge` | **1차 선결제:** 대여료 + 보험료 결제 실행 |
| `POST` | `/api/v1/payments/second-settlement`| **2차 후결제:** 반납 후 OCR 주행거리 정산 결제 |

### 5. AI 비전 및 OCR (`/api/v1/ai`)
| Method | Endpoint | 설명 |
| :--- | :--- | :--- |
| `POST` | `/api/v1/ai/car-grade` | 차량 4면 사진 분석 후 외관 A~D 등급 자동 산정 |
| `POST` | `/api/v1/ai/damage-diff` | 대여 전/후 사진 비교 및 신규 스크래치 감지 리포트 생성 |
| `POST` | `/api/v1/ai/ocr-odometer` | 대여 전/후 계기판 사진에서 주행거리(km) 추출 |

### 6. 채팅 및 긴급 접수 (`/api/v1/chat`, `/api/v1/accidents`)
| Method | Endpoint | 설명 |
| :--- | :--- | :--- |
| `GET` | `/api/v1/chat/rooms` | 참여 중인 1:1 채팅방 목록 조회 |
| `GET` | `/api/v1/chat/rooms/:roomId/messages` | 특정 채팅방 메시지 이력 조회 |
| `POST` | `/api/v1/accidents/report` | 24시간 긴급 사고 접수 (위치, 사진, 보험사 통보) |

### 7. 매너 평가 & 호스트 대시보드 (`/api/v1/reviews`, `/api/v1/host`)
| Method | Endpoint | 설명 |
| :--- | :--- | :--- |
| `POST` | `/api/v1/reviews` | 반납 완료 후 매너 평가 제출 (온도 산정) |
| `GET` | `/api/v1/host/pricing-recommendation` | AI Dynamic 요금 추천 가이드 조회 |
| `GET` | `/api/v1/host/revenue-dashboard` | 일/주/월 정산 내역 및 예상 수익 분석 |

---

## ⚡ 시작하기 (Getting Started)

### 1. 저장소 클론 및 패키지 설치
```bash
git clone https://github.com/your-org/neighbor-car-backend.git
cd neighbor-car-backend
npm install
```

### 2. 데이터베이스 설정 및 마이그레이션
```bash
# PostgreSQL & PostGIS 컨테이너 실행 (Docker 사용 시)
docker run --name neighbor-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgis/postgis

# Prisma 마이그레이션 실행
npx prisma migrate dev --name init

# Prisma Client 생성
npx prisma generate
```

### 3. 개발 서버 실행
```bash
# 개발 모드 실행
npm run start:dev

# 프로덕션 빌드 & 실행
npm run build
npm run start:prod
```

---

## 🔐 환경 변수 설정 (.env)

프로젝트 루트 경로에 `.env` 파일을 생성하고 아래 환경 변수를 구성합니다:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/neighbor_car?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# JWT
JWT_SECRET="super-secret-jwt-key-replace-in-production"
JWT_EXPIRATION="7d"

# AWS S3 (사진 업로드)
AWS_REGION="ap-northeast-2"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET_NAME="neighbor-car-storage"

# AI Multimodal Vision (Google Gemini API)
GEMINI_API_KEY="your-gemini-api-key"

# External Verification APIs
NICE_AUTH_CLIENT_ID="your-nice-client-id"
NICE_AUTH_CLIENT_SECRET="your-nice-client-secret"
KOTSA_API_KEY="your-driver-license-api-key"
MOLIT_CAR_API_KEY="your-car-ownership-api-key"

# Map & Geocoding
KAKAO_REST_API_KEY="your-kakao-rest-api-key"
NAVER_MAP_CLIENT_ID="your-naver-client-id"
NAVER_MAP_CLIENT_SECRET="your-naver-client-secret"

# Payment Gateway (Toss Payments)
TOSS_PAYMENTS_SECRET_KEY="test_sk_your_toss_secret_key"

# Insurance Partner API
INSURANCE_API_ENDPOINT="https://api.insurance-partner.com/v1"
INSURANCE_API_KEY="your-insurance-partner-api-key"

# Firebase Cloud Messaging
FIREBASE_PROJECT_ID="neighbor-car-firebase"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@neighbor-car.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 📜 라이선스 (License)
This project is licensed under the [MIT License](LICENSE).

