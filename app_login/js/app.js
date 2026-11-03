// 근차(GeunCha) - 이웃 간 카 쉐어링 애플리케이션 상태 및 인터랙션

// 앱 전역 상태
const appState = {
  currentStep: 1, // 1: 역할 선택, 2: 기본 계정 정보, 3: 프로필 설정, 4: 가입 완료, 'mypage': 마이페이지
  selectedRole: 'guest', // 'guest' | 'host'
  userData: {
    email: '',
    phone: '',
    nickname: '삼전동드라이버',
    town: '서울특별시 송파구 삼전동',
    avatar: '🚗',
    avatarIsImg: false,
    avatarSrc: ''
  },
  guestData: {
    licenseType: '제2종 보통 (인증완료 ✓)',
    licenseNo: '서울-11-234567-22',
    cards: [
      { name: '현대카드 M (신용)', number: '****-****-****-4219', isDefault: true }
    ]
  },
  hostData: {
    carModel: '기아 EV6 롱레인지 어스',
    carNo: '12가 3456',
    schedule: '월~금 09:00 ~ 18:00',
    rate: '6,500원 / 시간',
    bankName: '카카오뱅크',
    bankAcc: '3333-01-2345679'
  },
  checks: {
    emailVerified: false,
    phoneVerified: false,
    nicknameVerified: false
  },
  smsTimerInterval: null
};

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  updateStepView();
});

// 이벤트 리스너 등록
function setupEventListeners() {
  // 상단 뷰 모드 토글 (모바일 프레임 <-> 와이드 뷰)
  const btnToggleView = document.getElementById('btnToggleView');
  const phoneContainer = document.getElementById('phoneContainer');
  btnToggleView.addEventListener('click', () => {
    phoneContainer.classList.toggle('full-view');
  });

  // 상단 마이페이지 바로보기
  const btnGoMyPageDirect = document.getElementById('btnGoMyPageDirect');
  btnGoMyPageDirect.addEventListener('click', () => {
    goToStep('mypage');
  });

  // 헤더 뒤로가기 버튼
  const btnHeaderBack = document.getElementById('btnHeaderBack');
  btnHeaderBack.addEventListener('click', handleBackNavigation);

  // 하단 메인 액션 버튼 (다음 단계 / 완료)
  const btnNextStep = document.getElementById('btnNextStep');
  btnNextStep.addEventListener('click', handleNextStep);

  // 이메일 중복확인
  const btnCheckEmail = document.getElementById('btnCheckEmail');
  btnCheckEmail.addEventListener('click', handleEmailCheck);

  // 비밀번호 입력 및 강도 체크
  const inputPw = document.getElementById('inputPw');
  inputPw.addEventListener('input', handlePasswordInput);

  // 비밀번호 토글
  const btnTogglePw = document.getElementById('btnTogglePw');
  btnTogglePw.addEventListener('click', () => {
    inputPw.type = inputPw.type === 'password' ? 'text' : 'password';
  });

  // 비밀번호 일치 확인
  const inputPwConfirm = document.getElementById('inputPwConfirm');
  inputPwConfirm.addEventListener('input', handlePasswordConfirm);

  // 휴대폰 번호 포맷팅 & 인증요청
  const inputPhone = document.getElementById('inputPhone');
  inputPhone.addEventListener('input', handlePhoneInputFormat);

  const btnSendSms = document.getElementById('btnSendSms');
  btnSendSms.addEventListener('click', handleSendSms);

  const btnVerifySms = document.getElementById('btnVerifySms');
  btnVerifySms.addEventListener('click', handleVerifySms);

  // 프로필 아바타 파일 업로드
  const fileAvatarInput = document.getElementById('fileAvatarInput');
  fileAvatarInput.addEventListener('change', handleAvatarFileUpload);

  // 닉네임 중복확인
  const btnCheckNickname = document.getElementById('btnCheckNickname');
  btnCheckNickname.addEventListener('click', handleNicknameCheck);

  // 동네 변경 시뮬레이션
  const btnChangeTown = document.getElementById('btnChangeTown');
  btnChangeTown.addEventListener('click', () => {
    const newTown = prompt('활동 희망 동네를 입력해 주세요:', appState.userData.town);
    if (newTown && newTown.trim()) {
      appState.userData.town = newTown.trim();
      document.getElementById('inputTown').value = appState.userData.town;
      showToast(`활동 동네가 '${appState.userData.town}'(으)로 설정되었습니다.`);
    }
  });

  // 약관 전체 동의 처리
  const chkAll = document.getElementById('chkAllTerms');
  const subChecks = document.querySelectorAll('.chk-sub');

  chkAll.addEventListener('change', (e) => {
    subChecks.forEach(chk => chk.checked = e.target.checked);
  });

  subChecks.forEach(chk => {
    chk.addEventListener('change', () => {
      const allChecked = Array.from(subChecks).every(c => c.checked);
      chkAll.checked = allChecked;
    });
  });
}

// 스텝 1: 역할 선택 핸들러
function selectRole(role) {
  appState.selectedRole = role;
  const cardGuest = document.getElementById('cardGuest');
  const cardHost = document.getElementById('cardHost');

  if (role === 'guest') {
    cardGuest.classList.add('selected');
    cardHost.classList.remove('selected');
    showToast('게스트(차량 대여) 역할을 선택하셨습니다.');
  } else {
    cardHost.classList.add('selected');
    cardGuest.classList.remove('selected');
    showToast('호스트(차량 공유) 역할을 선택하셨습니다.');
  }
}

// 스텝 전환 및 뷰 업데이트
function updateStepView() {
  const step = appState.currentStep;
  const progressWrapper = document.getElementById('progressWrapper');
  const bottomActionBar = document.getElementById('bottomActionBar');
  const headerTitle = document.getElementById('headerTitle');
  const progressBarFill = document.getElementById('progressBarFill');
  const stepCounterText = document.getElementById('stepCounterText');
  const btnNextStep = document.getElementById('btnNextStep');

  // 모든 스텝 숨기기
  document.querySelectorAll('.step-view').forEach(view => view.style.display = 'none');

  if (step === 1) {
    document.getElementById('step1View').style.display = 'block';
    progressWrapper.style.display = 'block';
    bottomActionBar.style.display = 'block';
    headerTitle.innerText = '근차 회원가입';
    progressBarFill.style.width = '33.3%';
    stepCounterText.innerText = '1 / 3 단계';
    btnNextStep.innerHTML = '<span>기본 정보 입력하기</span> →';
  } else if (step === 2) {
    document.getElementById('step2View').style.display = 'block';
    progressWrapper.style.display = 'block';
    bottomActionBar.style.display = 'block';
    headerTitle.innerText = '계정 정보 입력';
    progressBarFill.style.width = '66.6%';
    stepCounterText.innerText = '2 / 3 단계';
    btnNextStep.innerHTML = '<span>프로필 설정으로 이동</span> →';
  } else if (step === 3) {
    document.getElementById('step3View').style.display = 'block';
    progressWrapper.style.display = 'block';
    bottomActionBar.style.display = 'block';
    headerTitle.innerText = '프로필 & 약관 동의';
    progressBarFill.style.width = '100%';
    stepCounterText.innerText = '3 / 3 단계';
    btnNextStep.innerHTML = '<span>근차 가입 완료하기</span> 🎉';
  } else if (step === 4) {
    document.getElementById('step4View').style.display = 'block';
    progressWrapper.style.display = 'none';
    bottomActionBar.style.display = 'block';
    headerTitle.innerText = '가입 완료';
    btnNextStep.innerHTML = '<span>마이페이지에서 관리하기</span> 👤';
    renderStep4Onboarding();
  } else if (step === 'mypage') {
    document.getElementById('mypageView').style.display = 'block';
    progressWrapper.style.display = 'none';
    bottomActionBar.style.display = 'none'; // 마이페이지 자체 메뉴로 조작
    headerTitle.innerText = '마이페이지 (계정 관리)';
    updateMyPageProfile();
  }

  // 화면 최상단 스크롤
  document.getElementById('appContent').scrollTop = 0;
}

// 다음 단계 버튼 클릭
function handleNextStep() {
  if (appState.currentStep === 1) {
    goToStep(2);
  } else if (appState.currentStep === 2) {
    const email = document.getElementById('inputEmail').value.trim();
    const pw = document.getElementById('inputPw').value;
    const pwConfirm = document.getElementById('inputPwConfirm').value;
    const phone = document.getElementById('inputPhone').value.trim();

    if (!email) {
      showToast('이메일 아이디를 입력해 주세요.');
      document.getElementById('inputEmail').focus();
      return;
    }
    if (!pw || pw.length < 8) {
      showToast('비밀번호를 8자 이상 입력해 주세요.');
      document.getElementById('inputPw').focus();
      return;
    }
    if (pw !== pwConfirm) {
      showToast('비밀번호가 일치하지 않습니다.');
      document.getElementById('inputPwConfirm').focus();
      return;
    }
    if (!phone) {
      showToast('휴대폰 번호를 입력해 주세요.');
      document.getElementById('inputPhone').focus();
      return;
    }

    appState.userData.email = email;
    appState.userData.phone = phone;
    goToStep(3);
  } else if (appState.currentStep === 3) {
    const nick = document.getElementById('inputNickname').value.trim();
    const chkAge = document.getElementById('chkAge').checked;
    const chkService = document.getElementById('chkService').checked;
    const chkPrivacy = document.getElementById('chkPrivacy').checked;
    const chkLocation = document.getElementById('chkLocation').checked;

    if (!nick) {
      showToast('이웃에게 보여질 닉네임을 입력해 주세요.');
      document.getElementById('inputNickname').focus();
      return;
    }
    if (!chkAge || !chkService || !chkPrivacy || !chkLocation) {
      showToast('모든 필수 약관에 동의해 주세요.');
      return;
    }

    appState.userData.nickname = nick;
    goToStep(4);
  } else if (appState.currentStep === 4) {
    goToStep('mypage');
  }
}

// 뒤로가기 동작
function handleBackNavigation() {
  if (appState.currentStep === 'mypage') {
    goToStep(4);
  } else if (appState.currentStep > 1) {
    goToStep(appState.currentStep - 1);
  } else {
    showToast('첫 번째 단계입니다.');
  }
}

function goToStep(step) {
  appState.currentStep = step;
  updateStepView();
}

// ----------------------------------------------------
// Step 2 입력 유효성 및 인터랙션
// ----------------------------------------------------
function handleEmailCheck() {
  const emailInput = document.getElementById('inputEmail');
  const feedback = document.getElementById('emailFeedback');
  const val = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!val) {
    feedback.className = 'form-feedback error';
    feedback.innerHTML = '✕ 이메일을 입력해 주세요.';
    emailInput.classList.add('error');
    return;
  }

  if (!emailRegex.test(val)) {
    feedback.className = 'form-feedback error';
    feedback.innerHTML = '✕ 유효한 이메일 형식이 아닙니다 (예: name@geuncha.com).';
    emailInput.classList.add('error');
    return;
  }

  emailInput.classList.remove('error');
  feedback.className = 'form-feedback success';
  feedback.innerHTML = '✓ 사용 가능한 이메일입니다.';
  appState.checks.emailVerified = true;
  showToast('이메일 중복 확인 완료!');
}

function handlePasswordInput(e) {
  const val = e.target.value;
  const bar1 = document.getElementById('pwBar1');
  const bar2 = document.getElementById('pwBar2');
  const bar3 = document.getElementById('pwBar3');
  const feedback = document.getElementById('pwFeedback');

  bar1.className = 'pw-strength-step';
  bar2.className = 'pw-strength-step';
  bar3.className = 'pw-strength-step';

  if (val.length === 0) {
    feedback.innerHTML = '영문, 숫자, 특수문자를 혼합해 주세요.';
    return;
  }

  let strength = 0;
  if (val.length >= 8) strength++;
  if (/[0-9]/.test(val) && /[a-zA-Z]/.test(val)) strength++;
  if (/[^a-zA-Z0-9]/.test(val)) strength++;

  if (strength === 1) {
    bar1.className = 'pw-strength-step active-weak';
    feedback.innerHTML = '⚠️ 비밀번호가 취약합니다 (8자 이상, 영문/숫자 혼합 필요).';
  } else if (strength === 2) {
    bar1.className = 'pw-strength-step active-medium';
    bar2.className = 'pw-strength-step active-medium';
    feedback.innerHTML = '👍 적절한 비밀번호입니다 (특수문자 포함 권장).';
  } else if (strength >= 3) {
    bar1.className = 'pw-strength-step active-strong';
    bar2.className = 'pw-strength-step active-strong';
    bar3.className = 'pw-strength-step active-strong';
    feedback.innerHTML = '🔒 매우 안전한 비밀번호입니다!';
  }
}

function handlePasswordConfirm(e) {
  const pw = document.getElementById('inputPw').value;
  const pwConfirm = e.target.value;
  const feedback = document.getElementById('pwConfirmFeedback');

  if (!pwConfirm) {
    feedback.innerHTML = '';
    return;
  }

  if (pw === pwConfirm) {
    feedback.className = 'form-feedback success';
    feedback.innerHTML = '✓ 비밀번호가 일치합니다.';
  } else {
    feedback.className = 'form-feedback error';
    feedback.innerHTML = '✕ 비밀번호가 일치하지 않습니다.';
  }
}

function handlePhoneInputFormat(e) {
  let val = e.target.value.replace(/[^0-9]/g, '');
  if (val.length > 3 && val.length <= 7) {
    val = val.slice(0, 3) + '-' + val.slice(3);
  } else if (val.length > 7) {
    val = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7, 11);
  }
  e.target.value = val;
}

function handleSendSms() {
  const phone = document.getElementById('inputPhone').value.trim();
  if (phone.length < 12) {
    showToast('올바른 휴대폰 번호를 입력해 주세요.');
    return;
  }

  document.getElementById('smsCodeGroup').style.display = 'block';
  document.getElementById('inputSmsCode').value = '123456'; // 모의 테스트용 자동 채움 편의
  showToast(`[근차] ${phone} 번호로 인증번호(123456)를 발송했습니다.`);

  // 타이머 3분 카운트다운
  let remain = 180;
  const timerSpan = document.getElementById('smsTimer');
  if (appState.smsTimerInterval) clearInterval(appState.smsTimerInterval);

  appState.smsTimerInterval = setInterval(() => {
    remain--;
    const min = String(Math.floor(remain / 60)).padStart(2, '0');
    const sec = String(remain % 60).padStart(2, '0');
    timerSpan.innerText = `${min}:${sec}`;

    if (remain <= 0) {
      clearInterval(appState.smsTimerInterval);
      timerSpan.innerText = '만료됨';
    }
  }, 1000);
}

function handleVerifySms() {
  const code = document.getElementById('inputSmsCode').value.trim();
  const feedback = document.getElementById('phoneFeedback');

  if (code === '123456' || code.length === 6) {
    if (appState.smsTimerInterval) clearInterval(appState.smsTimerInterval);
    feedback.className = 'form-feedback success';
    feedback.innerHTML = '✓ 본인 실명 인증이 성공적으로 완료되었습니다.';
    appState.checks.phoneVerified = true;
    showToast('본인 인증 완료!');
  } else {
    feedback.className = 'form-feedback error';
    feedback.innerHTML = '✕ 올바른 인증번호 6자리를 입력해 주세요.';
  }
}

// ----------------------------------------------------
// Step 3 아바타 및 프로필
// ----------------------------------------------------
function setQuickAvatar(emoji) {
  appState.userData.avatar = emoji;
  appState.userData.avatarIsImg = false;
  document.getElementById('avatarIcon').innerText = emoji;
  document.getElementById('avatarIcon').style.display = 'block';
  document.getElementById('avatarImg').style.display = 'none';

  // 아바타 칩 스타일
  document.querySelectorAll('.avatar-chip').forEach(chip => {
    if (chip.innerText === emoji) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

function handleAvatarFileUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      appState.userData.avatarIsImg = true;
      appState.userData.avatarSrc = event.target.result;

      const imgEl = document.getElementById('avatarImg');
      imgEl.src = event.target.result;
      imgEl.style.display = 'block';
      document.getElementById('avatarIcon').style.display = 'none';
      showToast('프로필 사진이 업로드되었습니다.');
    };
    reader.readAsDataURL(file);
  }
}

function handleNicknameCheck() {
  const input = document.getElementById('inputNickname');
  const feedback = document.getElementById('nicknameFeedback');
  const val = input.value.trim();

  if (val.length < 2) {
    feedback.className = 'form-feedback error';
    feedback.innerHTML = '✕ 닉네임은 2자 이상 입력해 주세요.';
    return;
  }

  feedback.className = 'form-feedback success';
  feedback.innerHTML = '✓ 이웃들이 부르기 좋은 멋진 닉네임이에요!';
  appState.checks.nicknameVerified = true;
  showToast(`'${val}' 닉네임을 사용할 수 있습니다.`);
}

// ----------------------------------------------------
// Step 4 가입 완료 및 온보딩 렌더링
// ----------------------------------------------------
function renderStep4Onboarding() {
  const nick = appState.userData.nickname || '삼전동드라이버';
  document.getElementById('welcomeUserTitle').innerHTML = `환영합니다!<br>${nick}님`;

  const role = appState.selectedRole;
  const roleBadge = document.getElementById('registeredRoleBadge');
  const container = document.getElementById('onboardingList');

  if (role === 'guest') {
    roleBadge.innerHTML = '🚗 게스트 (이웃 차량 대여)';
    container.innerHTML = `
      <div class="onboarding-item" onclick="openModal('licenseModal')">
        <div class="onboarding-info">
          <h4><span>🪪</span> 1. 운전면허증 등록</h4>
          <p>안전한 대여를 위해 1분 만에 면허증 촬영 및 등록</p>
        </div>
        <span class="status-badge pending">등록하기 ></span>
      </div>
      <div class="onboarding-item" onclick="openModal('cardModal')">
        <div class="onboarding-info">
          <h4><span>💳</span> 2. 결제 카드 등록</h4>
          <p>예약 시 1초 만에 자동 결제되는 간편 카드 등록</p>
        </div>
        <span class="status-badge pending">등록하기 ></span>
      </div>
      <div class="onboarding-item" onclick="openModal('insuranceModal')">
        <div class="onboarding-info">
          <h4><span>🛡️</span> 3. 원데이 보험 보장 확인</h4>
          <p>이용할 때마다 자동 가입되는 안심 보장 내역</p>
        </div>
        <span class="status-badge done">자동가입 ✓</span>
      </div>
    `;
  } else {
    roleBadge.innerHTML = '🔑 호스트 (내 차량 공유)';
    container.innerHTML = `
      <div class="onboarding-item" onclick="openModal('carModal')">
        <div class="onboarding-info">
          <h4><span>🚘</span> 1. 내 차량 등록</h4>
          <p>차량 번호, 차종 및 이웃에게 보여질 차량 사진 등록</p>
        </div>
        <span class="status-badge pending">등록하기 ></span>
      </div>
      <div class="onboarding-item" onclick="openModal('scheduleModal')">
        <div class="onboarding-info">
          <h4><span>⏰</span> 2. 대여 가능 시간 설정</h4>
          <p>내가 차를 타지 않는 출퇴근/주말 시간 자유 지정</p>
        </div>
        <span class="status-badge pending">설정하기 ></span>
      </div>
      <div class="onboarding-item" onclick="openModal('bankModal')">
        <div class="onboarding-info">
          <h4><span>💰</span> 3. 수익 정산 계좌 등록</h4>
          <p>대여 완료 후 매월 정산금이 입금될 계좌 등록</p>
        </div>
        <span class="status-badge pending">등록하기 ></span>
      </div>
    `;
  }
}

// ----------------------------------------------------
// 마이페이지(My Page) 대시보드
// ----------------------------------------------------
function updateMyPageProfile() {
  document.getElementById('myPageNick').innerText = appState.userData.nickname || '삼전동드라이버';
  document.getElementById('myPageEmail').innerText = (appState.userData.email || 'neighbor@geuncha.com') + ' | ' + appState.userData.town;

  const myAvatarEl = document.getElementById('myPageAvatar');
  if (appState.userData.avatarIsImg && appState.userData.avatarSrc) {
    myAvatarEl.innerHTML = `<img src="${appState.userData.avatarSrc}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
  } else {
    myAvatarEl.innerHTML = appState.userData.avatar || '🚗';
  }

  // 기본 역할 탭 활성화
  switchMyPageRole(appState.selectedRole);
}

// 마이페이지 역할 전환 스위치 (게스트 ↔ 호스트)
function switchMyPageRole(role) {
  const btnGuest = document.getElementById('btnSwitchGuest');
  const btnHost = document.getElementById('btnSwitchHost');
  const guestSection = document.getElementById('guestSection');
  const hostSection = document.getElementById('hostSection');

  if (role === 'guest') {
    btnGuest.classList.add('active');
    btnHost.classList.remove('active');
    guestSection.style.display = 'block';
    hostSection.style.display = 'none';
    showToast('🚗 게스트 모드로 전환되었습니다.');
  } else {
    btnHost.classList.add('active');
    btnGuest.classList.remove('active');
    hostSection.style.display = 'block';
    guestSection.style.display = 'none';
    showToast('🔑 호스트 모드로 전환되었습니다.');
  }
}

// 모달 제어 함수
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// 약관 모달 편의
function showModal(type) {
  if (type === 'ageInfo') {
    alert('[만 21세 이상 자격 확인]\n근차는 안전한 P2P 카 쉐어링 생태계 구축 및 원데이 자동차 종합보험 가입 기준에 따라 만 21세 이상, 운전면허 취득 1년 이상의 운전자만 대여가 가능합니다.');
  } else if (type === 'serviceTerm') {
    alert('[근차 서비스 이용약관]\n이웃 간 신뢰 기반의 차량 공유를 위해 지정된 반납 시간 및 주차 위치를 준수하며, 차량 내 금연 및 청결 유지를 기본 원칙으로 합니다.');
  } else if (type === 'privacyTerm') {
    alert('[개인정보 수집 및 이용 동의]\n서비스 제공, 운전면허 진위 확인 및 본인 인증, 차량 예약 및 결제 처리를 위해 최소한의 개인정보를 수집 및 보관합니다.');
  } else if (type === 'locationTerm') {
    alert('[위치기반 서비스 이용약관]\n내 주변 500m 이웃 차량 검색 및 대여 중 비대면 스마트키 동작, 안심 반납 확인을 위해 단말기 위치 정보를 활용합니다.');
  }
}

// 마이페이지 데이터 저장 인터랙션
function saveLicenseInfo() {
  const selectType = document.getElementById('selectLicenseType').value;
  const inputNo = document.getElementById('inputModalLicenseNo').value;
  appState.guestData.licenseType = selectType + ' (인증완료 ✓)';
  appState.guestData.licenseNo = inputNo;

  document.getElementById('displayLicenseType').innerText = appState.guestData.licenseType;
  document.getElementById('displayLicenseNo').innerText = appState.guestData.licenseNo;
  closeModal('licenseModal');
  showToast('운전면허증 정보가 업데이트되었습니다.');
}

function addNewCard() {
  const cardNo = document.getElementById('inputCardNo').value.trim() || '****-****-****-8812';
  const cardName = document.getElementById('inputCardName').value.trim() || '신규 결제 카드';

  const container = document.getElementById('cardListContainer');
  const cardEl = document.createElement('div');
  cardEl.className = 'data-row';
  cardEl.style.cssText = 'background: #f8fafc; padding: 10px; border-radius: 8px; margin-top: 8px;';
  cardEl.innerHTML = `
    <div>
      <div style="font-weight: 700; font-size: 13px;">${cardName}</div>
      <div style="font-size: 11px; color: var(--text-muted);">${cardNo}</div>
    </div>
    <button class="view-toggle-btn" style="color: var(--danger);" onclick="deleteCard(this)">삭제</button>
  `;
  container.appendChild(cardEl);

  closeModal('cardModal');
  showToast('새 결제 카드가 성공적으로 등록되었습니다.');
}

function deleteCard(btn) {
  if (confirm('이 카드를 삭제하시겠습니까?')) {
    btn.parentElement.remove();
    showToast('카드가 삭제되었습니다.');
  }
}

function saveCarInfo() {
  const model = document.getElementById('inputModalCarModel').value;
  const no = document.getElementById('inputModalCarNo').value;
  document.getElementById('displayCarModel').innerText = model;
  document.getElementById('displayCarNo').innerText = no;
  closeModal('carModal');
  showToast('내 공유 차량 정보가 저장되었습니다.');
}

function saveScheduleInfo() {
  const mode = document.getElementById('selectScheduleMode').value;
  const rate = document.getElementById('inputHourlyRate').value;
  closeModal('scheduleModal');
  showToast(`대여 스케줄('${mode}', 시간당 ${Number(rate).toLocaleString()}원)이 반영되었습니다.`);
}

function saveBankInfo() {
  const bank = document.getElementById('selectBank').value;
  const acc = document.getElementById('inputBankAcc').value;
  document.getElementById('displayBankName').innerText = bank;
  document.getElementById('displayBankNo').innerText = acc;
  closeModal('bankModal');
  showToast('정산 계좌가 성공적으로 등록/변경되었습니다.');
}

// 토스트 메시지 유틸리티
function showToast(msg) {
  const toast = document.getElementById('toastMsg');
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

