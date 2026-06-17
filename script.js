// TODO: 배포하신 GAS Web App URL을 아래에 붙여넣어 주세요.
const GAS_URL = "https://script.google.com/macros/s/AKfycbxqgBUoXg1eFxC9pV5pCRFPKY6ZIAx-YgTjGpJVGYxU8efjMlsCrF7zmhURhCY7Uqye2A/exec";

const questions = [
    {
        category: "인식",
        question: "새로운 AI 기술이나 사내 AI 툴이 도입되었을 때 나의 반응은?",
        options: [
            { text: "아직은 익숙한 기존 방식이 편하다.", score: 1 },
            { text: "관심은 있지만, 누가 알려주기 전까지는 선뜻 써보지 않는다.", score: 2 },
            { text: "간단한 기능 위주로 직접 테스트해보고 업무에 적용해본다.", score: 3 },
            { text: "관련 매뉴얼이나 사례를 적극적으로 찾아보고 선도적으로 활용한다.", score: 4 }
        ]
    },
    {
        category: "생산성",
        question: "보고서 초안 작성, 이메일 번역, 회의록 요약 등에 AI를 얼마나 활용하나요?",
        options: [
            { text: "거의 사용하지 않고 직접 작성한다.", score: 1 },
            { text: "가끔 필요할 때 번역기나 기본적인 챗봇을 사용한다.", score: 2 },
            { text: "주 2~3회 이상 문서 요약, 아이디어 도출 등을 위해 AI를 사용한다.", score: 3 },
            { text: "대부분의 문서 작업 초안을 AI로 작성하고 다듬는 방식으로 효율을 극대화한다.", score: 4 }
        ]
    },
    {
        category: "직무(반도체)",
        question: "데이터 분석, 코드 작성, 또는 기술 스펙 리서치 등에 AI를 어떻게 활용하나요?",
        options: [
            { text: "전문 영역에는 AI 결과물을 신뢰할 수 없어 활용하지 않는다.", score: 1 },
            { text: "간단한 함수 검색이나 구글링 대신 챗봇에게 물어보는 수준이다.", score: 2 },
            { text: "복잡한 수식 생성, 데이터 전처리 코드 작성 등에 AI를 활용해 시간을 단축한다.", score: 3 },
            { text: "오류 분석, 최적화 방안 도출 등 문제 해결의 파트너로서 AI와 깊게 상호작용한다.", score: 4 }
        ]
    },
    {
        category: "직무(반도체)",
        question: "원하는 결과물을 얻기 위해 프롬프트(명령어)를 어떻게 작성하나요?",
        options: [
            { text: "단답형이나 단순한 키워드 위주로 질문한다. (예: 반도체 수율이란?)", score: 1 },
            { text: "문장형으로 묻고, 원하는 답변이 안 나오면 몇 번 정도 다시 묻는다.", score: 2 },
            { text: "배경 상황과 역할, 원하는 출력 형식을 구체적으로 지정하여 질문한다.", score: 3 },
            { text: "사내 데이터나 특정 예시를 제공하여 나만의 고도화된 프롬프트 템플릿을 보유하고 있다.", score: 4 }
        ]
    }
];

let currentQuestionIndex = 0;
let totalScore = 0;
let currentEmpId = '';
let currentEmpName = '';
let userSelections = [];
let shuffledQuestions = [];

// 주관식 답변용 변수
let subjCurrentTool = '';
let subjWantTool = '';

// DOM Elements
const introView = document.getElementById('intro-view');
const authView = document.getElementById('auth-view');
const quizView = document.getElementById('quiz-view');
const subjectiveView = document.getElementById('subjective-view');
const loadingView = document.getElementById('loading-view');
const resultView = document.getElementById('result-view');

const startBtn = document.getElementById('start-btn');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const empIdInput = document.getElementById('emp-id');
const empNameInput = document.getElementById('emp-name');
const authError = document.getElementById('auth-error');

const questionNumber = document.getElementById('question-number');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const progressBar = document.getElementById('progress-bar');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

const subjectiveSubmitBtn = document.getElementById('subjective-submit-btn');
const subjectivePrevBtn = document.getElementById('subjective-prev-btn');


const restartBtn = document.getElementById('restart-btn');

// Event Listeners
startBtn.addEventListener('click', showAuth);
authSubmitBtn.addEventListener('click', handleAuthSubmit);
subjectiveSubmitBtn.addEventListener('click', handleSubjectiveSubmit);
subjectivePrevBtn.addEventListener('click', handleSubjectivePrevClick);
restartBtn.addEventListener('click', resetQuiz);
prevBtn.addEventListener('click', handlePrevClick);
nextBtn.addEventListener('click', handleNextClick);

function switchView(viewElement) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    viewElement.classList.add('active');
}

function showAuth() {
    empIdInput.value = '';
    empNameInput.value = '';
    authError.innerText = '';
    switchView(authView);
}

async function handleAuthSubmit() {
    const empId = empIdInput.value.trim();
    const empName = empNameInput.value.trim();

    if (!empId || !empName) {
        authError.innerText = "사번과 성명을 모두 입력해 주세요.";
        return;
    }

    // 서버로 사번 중복 확인 요청
    authError.style.color = '#1e88e5'; // 로딩 안내 메시지 (파란색)
    authError.innerText = "참여 이력을 확인 중입니다...";

    // 버튼 비활성화 방어
    const authSubmitBtn = document.querySelector('#auth-view .btn');
    if (authSubmitBtn) authSubmitBtn.disabled = true;

    try {
        if (GAS_URL && GAS_URL !== "YOUR_GAS_URL_HERE") {
            const checkUrl = `${GAS_URL}?action=check&empId=${encodeURIComponent(empId)}`;
            const response = await fetch(checkUrl);
            const resultData = await response.json();

            if (resultData.exists) {
                authError.style.color = '#d32f2f'; // 에러 색상 (빨간색) 복구
                authError.innerText = "해당 사번은 이미 진단에 참여하였습니다.";
                if (authSubmitBtn) authSubmitBtn.disabled = false;
                return;
            }
        }
    } catch (error) {
        console.error("중복 확인 중 에러 발생:", error);
        // CORS 문제나 네트워크 에러 시 사용자가 영원히 갇히는 것을 방지하기 위해 
        // 실전에서는 아래를 풀고 에러를 띄우거나, 무시하고 진행하게 설계할 수 있습니다.
        // 현재는 무시하고 진행하도록 하되, 엄격하게 막으려면 주석을 해제하세요.
        /*
        authError.style.color = '#d32f2f';
        authError.innerText = "네트워크 오류로 확인에 실패했습니다. 다시 시도해주세요.";
        if(authSubmitBtn) authSubmitBtn.disabled = false;
        return;
        */
    }

    // 검증 성공 후 진행
    authError.style.color = ''; // 기존 색상으로 초기화
    authError.innerText = "";
    if (authSubmitBtn) authSubmitBtn.disabled = false;

    // 전역 변수에 사번/성명 저장 (결과 전송 시 사용)
    currentEmpId = empId;
    currentEmpName = empName;

    startQuiz();
}

function startQuiz() {
    currentQuestionIndex = 0;
    userSelections = new Array(questions.length).fill(null);

    // 퀴즈 시작 시 1회만 각 문항의 보기 순서를 섞음
    shuffledQuestions = questions.map(q => {
        return {
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
        };
    });

    switchView(quizView);
    renderQuestion();
}

function renderQuestion() {
    const q = shuffledQuestions[currentQuestionIndex];
    questionNumber.innerText = `Q${currentQuestionIndex + 1}.`;
    questionText.innerText = q.question;

    // Update Progress
    const progress = ((currentQuestionIndex) / shuffledQuestions.length) * 100;
    progressBar.style.width = `${progress}%`;

    // Render Options
    optionsContainer.innerHTML = '';

    q.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (userSelections[currentQuestionIndex] === option.score) {
            btn.classList.add('selected');
        }
        btn.innerText = option.text;
        btn.onclick = () => selectOption(option.score, btn);
        optionsContainer.appendChild(btn);
    });

    // Update Nav Buttons
    prevBtn.style.visibility = currentQuestionIndex === 0 ? 'hidden' : 'visible';

    if (userSelections[currentQuestionIndex] === null) {
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
    }
}

function selectOption(score, selectedBtn) {
    userSelections[currentQuestionIndex] = score;

    // Remove 'selected' from all buttons
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));

    // Add 'selected' to clicked button
    selectedBtn.classList.add('selected');

    // Enable Next button
    nextBtn.disabled = false;
}

function handleNextClick() {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        // 모든 문항의 점수 합산
        totalScore = userSelections.reduce((sum, score) => sum + score, 0);
        progressBar.style.width = `100%`;
        setTimeout(() => {
            switchView(subjectiveView);
        }, 300);
    }
}

function handlePrevClick() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function handleSubjectivePrevClick() {
    // 마지막 문항으로 되돌아가기
    currentQuestionIndex = shuffledQuestions.length - 1;
    switchView(quizView);
    renderQuestion();
}

function handleSubjectiveSubmit() {
    const currentInputs = document.querySelectorAll('.current-tool-input');
    const wantInputs = document.querySelectorAll('.want-tool-input');

    const currentValues = Array.from(currentInputs).map(i => i.value.trim()).filter(v => v !== '');
    const wantValues = Array.from(wantInputs).map(i => i.value.trim()).filter(v => v !== '');

    if (currentValues.length === 0 || wantValues.length === 0) {
        alert("항목별로 최소 하나 이상의 AI Tool을 작성해 주세요.");
        return;
    }

    // 배열을 ' | ' 기호로 구분하여 취합 시 파싱이 쉽도록 처리
    subjCurrentTool = currentValues.join(' | ');
    subjWantTool = wantValues.join(' | ');

    showLoading();
}

function addInputRow(containerId, inputClass) {
    const container = document.getElementById(containerId);

    const row = document.createElement('div');
    row.className = 'dynamic-input-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = `dynamic-input ${inputClass}`;
    input.placeholder = '추가 입력';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-input-btn';
    removeBtn.innerText = '−'; // minus sign
    removeBtn.onclick = () => {
        container.removeChild(row);
    };

    row.appendChild(input);
    row.appendChild(removeBtn);
    container.appendChild(row);
}

function showLoading() {
    switchView(loadingView);

    // 사용자가 선택한 문항의 텍스트 추출 (결과 취합용)
    const q1Ans = shuffledQuestions[0] ? shuffledQuestions[0].options.find(opt => opt.score === userSelections[0])?.text : '';
    const q2Ans = shuffledQuestions[1] ? shuffledQuestions[1].options.find(opt => opt.score === userSelections[1])?.text : '';
    const q3Ans = shuffledQuestions[2] ? shuffledQuestions[2].options.find(opt => opt.score === userSelections[2])?.text : '';
    const q4Ans = shuffledQuestions[3] ? shuffledQuestions[3].options.find(opt => opt.score === userSelections[3])?.text : '';

    const payload = {
        empId: currentEmpId,
        empName: currentEmpName,
        score: totalScore,
        q1: q1Ans || '',
        q2: q2Ans || '',
        q3: q3Ans || '',
        q4: q4Ans || '',
        currentTool: subjCurrentTool,
        wantTool: subjWantTool
    };

    // 1.5초 기본 로딩 시간 보장 및 fetch 비동기 처리
    const minimumLoadingTime = new Promise(resolve => setTimeout(resolve, 1500));

    let fetchPromise = Promise.resolve();
    if (GAS_URL && GAS_URL !== "YOUR_GAS_URL_HERE") {
        fetchPromise = fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(payload)
        }).catch(error => console.error('Error sending data to GAS:', error));
    } else {
        console.warn("GAS_URL이 설정되지 않아 서버로 데이터가 전송되지 않습니다.");
    }

    // 로딩 최소 1.5초 대기 후 결과 화면 표시
    Promise.all([minimumLoadingTime, fetchPromise]).then(() => {
        showResult();
    });
}

function showResult() {
    switchView(resultView);
}

function resetQuiz() {
    // 단 1회 참여 가능하므로, 퀴즈 재시작 대신 처음 화면으로 새로고침
    location.reload();
}
