// TODO: 배포하신 GAS Web App URL을 아래에 붙여넣어 주세요.
const GAS_URL = "https://script.google.com/macros/s/AKfycbz5QLtkQB-EmKr56qq4aDAEootMZiSELTRhYWHKpbSOhDaVE7dV2gLDzHQmn991dRvrjw/exec";

const questions = [
    {
        type: "single",
        question: "평소 AI를 얼마나 자주 사용하시나요?",
        options: [
            { text: "AI에 대해 잘 모릅니다. (괜찮아요, 이제부터 알아가면 됩니다!)", score: 1 },
            { text: "호기심에 간단한 기능 위주로 한두 번 사용해 본 적이 있습니다.", score: 2 },
            { text: "업무나 일상에서 보조적 수단으로 가볍게 활용합니다.", score: 3 },
            { text: "매일 AI와 함께 지내며, 업무와 일상에서 적극 활용 중입니다.", score: 4 }
        ]
    },
    {
        type: "multiple",
        maxSelect: 2,
        question: "업무나 일상에서 주로 어떤 AI Tool을 사용하시나요? (최대 2개)",
        options: [
            { text: "ChatGPT" },
            { text: "Gemini" },
            { text: "Claude" },
            { text: "DeepL" },
            { text: "Notion AI" },
            { text: "Canva, Midjourney 등 디자인 Tool" },
            { text: "기타", hasDynamicInput: true },
            { text: "아직 자주 사용하는 Tool이 없습니다.", isExclusive: true }
        ]
    },
    {
        type: "multiple",
        maxSelect: 2,
        question: "AI를 활용해 본 업무가 있다면 알려주세요! (최대 2개)",
        options: [
            { text: "기본적인 챗봇 및 문서 번역" },
            { text: "이메일, 보고서 등 초안 작성" },
            { text: "아이디어 브레인스토밍 및 리서치 데이터 수집" },
            { text: "엑셀 수식 작성 및 데이터 분석" },
            { text: "디자인 이미지 생성" },
            { text: "기타", hasDynamicInput: true },
            { text: "아직 AI를 활용해 본 업무가 없습니다.", isExclusive: true }
        ]
    },
    {
        type: "text",
        question: "내 업무 중 \"이건 정말 AI의 도움을 받고 싶다!\"<br>생각이 드는 가장 귀찮은 업무는 무엇인가요?",
        placeholder: "답변을 입력해주세요. (필수)"
    },
    {
        type: "multiple",
        maxSelect: 2,
        question: "우리 회사에 공식적으로 도입되었으면 하는 AI Tool을 알려주세요. (최대 2개)",
        options: [
            { text: "Microsoft Copilot" },
            { text: "ChatGPT" },
            { text: "DeepL" },
            { text: "Notion AI" },
            { text: "기타", hasDynamicInput: true }
        ]
    },
    {
        type: "single",
        question: "향후 AI 활용법을 배우고, 동료들에게 노하우를 공유하는<br>'사내 AI 강사 프로그램'을 진행한다면 참여할 의향이 있으신가요?",
        options: [
            { text: "기회가 된다면 적극적으로 참여하겠습니다!" },
            { text: "관심이 있습니다. 일단 먼저 충분히 배워보고 결정하고 싶습니다." },
            { text: "아직은 다른 분들이 먼저 하는걸 지켜보고 싶습니다." }
        ]
    },
    {
        type: "single",
        question: "AI를 잘 활용하기 위해, 당장 듣고 싶은 교육은 무엇인가요?",
        options: [
            { text: "AI에게 똑똑하게 질문하는 법 (프롬프트 활용)" },
            { text: "내 업무에 바로 써먹는 맞춤형 AI 툴 활용법" },
            { text: "동료들의 실무 적용 사례 공유회" },
            { text: "기타", hasInput: true }
        ]
    },
    {
        type: "text",
        question: "AI 도입 및 교육에 있어, 회사가 어떤 점을 준비하면 좋을까요?<br>작은 아이디어나 건의사항이 있다면 자유롭게 알려주세요!",
        placeholder: "답변을 자유롭게 적어주세요. (선택)",
        optional: true
    }
];

let currentQuestionIndex = 0;
let totalScore = 0;
let currentEmpId = '';
let currentEmpName = '';

// userSelections[qIdx] = single ? [idx] : multiple ? [idx1, idx2] : text ? "string"
let userSelections = [];
// userCustomInputs[qIdx][optIdx] = ["val1", "val2"...]
let userCustomInputs = {};

// DOM Elements
const introView = document.getElementById('intro-view');
const authView = document.getElementById('auth-view');
const quizView = document.getElementById('quiz-view');
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

const restartBtn = document.getElementById('restart-btn');

// Event Listeners
startBtn.addEventListener('click', showAuth);
authSubmitBtn.addEventListener('click', handleAuthSubmit);
restartBtn.addEventListener('click', closeWindow);
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

    authError.style.color = '#1e88e5';
    authError.innerText = "참여 이력을 확인 중입니다...";

    const submitBtn = document.querySelector('#auth-view .btn');
    if (submitBtn) submitBtn.disabled = true;

    try {
        if (GAS_URL && GAS_URL !== "YOUR_GAS_URL_HERE") {
            const checkUrl = `${GAS_URL}?action=check&empId=${encodeURIComponent(empId)}&empName=${encodeURIComponent(empName)}`;
            const response = await fetch(checkUrl);
            const resultData = await response.json();

            // 사번/성명 검증 실패
            if (resultData.valid === false) {
                authError.style.color = '#d32f2f';
                authError.innerText = resultData.error || "사번과 성명이 일치하지 않습니다.";
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            // 중복 참여 검증
            if (resultData.exists) {
                authError.style.color = '#d32f2f';
                authError.innerText = "해당 사번은 이미 설문에 참여하였습니다.";
                if (submitBtn) submitBtn.disabled = false;
                return;
            }
        }
    } catch (error) {
        console.error("중복 확인 중 에러 발생:", error);
    }

    authError.style.color = '';
    authError.innerText = "";
    if (submitBtn) submitBtn.disabled = false;

    currentEmpId = empId;
    currentEmpName = empName;

    startQuiz();
}

function startQuiz() {
    currentQuestionIndex = 0;
    userSelections = new Array(questions.length).fill(null).map((_, i) => {
        return questions[i].type === 'text' ? "" : [];
    });
    userCustomInputs = {};

    switchView(quizView);
    renderQuestion();
}

function renderQuestion() {
    const q = questions[currentQuestionIndex];

    const partTitleEl = document.getElementById('part-title');
    if (partTitleEl) {
        partTitleEl.innerText = q.part ? q.part : '';
        partTitleEl.style.display = q.part ? 'block' : 'none';
    }

    questionNumber.innerHTML = `Q${currentQuestionIndex + 1}.`;
    let qText = q.question;
    if (qText.includes('(최대 2개)')) {
        qText = qText.replace('(최대 2개)', '<span class="max-select-text">(최대 2개)</span>');
    }
    questionText.innerHTML = qText;

    const progress = ((currentQuestionIndex) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;

    optionsContainer.innerHTML = '';
    optionsContainer.className = `options-container ${q.type}-choice`;

    if (q.type === 'text') {
        renderTextQuestion(q);
    } else {
        renderOptionsQuestion(q);
    }

    prevBtn.style.visibility = currentQuestionIndex === 0 ? 'hidden' : 'visible';
    checkNextButtonStatus();
}

function renderTextQuestion(q) {
    const textarea = document.createElement('textarea');
    textarea.className = 'text-response-input';
    textarea.placeholder = q.placeholder || "답변을 입력해 주세요.";
    textarea.value = userSelections[currentQuestionIndex] || "";

    textarea.addEventListener('input', (e) => {
        userSelections[currentQuestionIndex] = e.target.value;
        checkNextButtonStatus();
    });

    optionsContainer.appendChild(textarea);
}

function renderOptionsQuestion(q) {
    const currentSels = userSelections[currentQuestionIndex] || [];
    if (!userCustomInputs[currentQuestionIndex]) {
        userCustomInputs[currentQuestionIndex] = {};
    }
    const qCustomInputs = userCustomInputs[currentQuestionIndex];

    q.options.forEach((option, idx) => {
        const btn = document.createElement('div');
        btn.className = 'option-btn';
        if (currentSels.includes(idx)) {
            btn.classList.add('selected');
        }

        let innerHtml = `<div class="option-content">`;
        if (q.type === 'multiple') {
            innerHtml += `<div class="checkbox-box"></div>`;
        }
        innerHtml += `<span class="option-text">${option.text}</span></div>`;

        // Single Input or Dynamic Input Container
        const inputContainerId = `input-container-${currentQuestionIndex}-${idx}`;
        const inputDisplay = btn.classList.contains('selected') ? 'block' : 'none';

        if (option.hasInput || option.hasDynamicInput) {
            innerHtml += `<div id="${inputContainerId}" class="dynamic-inputs-wrapper" style="display: ${inputDisplay}; margin-top:10px;"></div>`;
        }

        btn.innerHTML = innerHtml;

        btn.onclick = (e) => {
            if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'button') return;
            selectOption(idx, btn, q);
        };

        optionsContainer.appendChild(btn);

        // Render inputs if needed
        if (option.hasInput || option.hasDynamicInput) {
            const wrapper = document.getElementById(inputContainerId);
            const savedVals = qCustomInputs[idx] || [""];
            if (savedVals.length === 0) savedVals.push("");

            savedVals.forEach((val, valIdx) => {
                wrapper.appendChild(createInputRow(q, idx, valIdx, val, option.hasDynamicInput));
            });
        }
    });
}

function createInputRow(q, optIdx, valIdx, value, isDynamic) {
    const row = document.createElement('div');
    row.className = 'dynamic-input-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'other-input';
    input.placeholder = "내용을 입력해 주세요";
    input.value = value;
    input.onclick = (e) => e.stopPropagation();

    input.addEventListener('input', (e) => {
        if (!userCustomInputs[currentQuestionIndex]) userCustomInputs[currentQuestionIndex] = {};
        if (!userCustomInputs[currentQuestionIndex][optIdx]) userCustomInputs[currentQuestionIndex][optIdx] = [""];
        userCustomInputs[currentQuestionIndex][optIdx][valIdx] = e.target.value;
        checkNextButtonStatus();
    });

    row.appendChild(input);

    if (isDynamic) {
        // Add or Remove Button
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.onclick = (e) => {
            e.stopPropagation();
            const arr = userCustomInputs[currentQuestionIndex][optIdx];
            if (valIdx === arr.length - 1) {
                // Add new row
                const currentSels = userSelections[currentQuestionIndex] || [];
                if (q.maxSelect) {
                    let currentTotal = 0;
                    currentSels.forEach(idx => {
                        const option = q.options[idx];
                        if (option.hasDynamicInput) {
                            const dynArr = (userCustomInputs[currentQuestionIndex] || {})[idx] || [""];
                            currentTotal += dynArr.length;
                        } else {
                            currentTotal += 1;
                        }
                    });
                    if (currentTotal + 1 > q.maxSelect) {
                        alert(`최대 ${q.maxSelect}개까지만 선택할 수 있습니다.`);
                        return;
                    }
                }
                arr.push("");
            } else {
                // Remove this row
                arr.splice(valIdx, 1);
            }
            // Re-render this specific option's inputs
            const wrapper = document.getElementById(`input-container-${currentQuestionIndex}-${optIdx}`);
            wrapper.innerHTML = '';
            arr.forEach((v, i) => wrapper.appendChild(createInputRow(q, optIdx, i, v, isDynamic)));
            checkNextButtonStatus();
        };

        // If it's the last row, show '+', otherwise show '-'
        const qCustomInputs = userCustomInputs[currentQuestionIndex][optIdx] || [""];
        if (valIdx === qCustomInputs.length - 1) {
            btn.className = 'add-input-btn';
            btn.innerText = '+';
        } else {
            btn.className = 'remove-input-btn';
            btn.innerText = '−';
        }
        row.appendChild(btn);
    }

    return row;
}

function checkNextButtonStatus() {
    const q = questions[currentQuestionIndex];

    if (q.type === 'text') {
        if (q.optional) {
            nextBtn.disabled = false;
        } else {
            const textVal = (userSelections[currentQuestionIndex] || "").trim();
            nextBtn.disabled = textVal.length === 0;
        }
        return;
    }

    const currentSels = userSelections[currentQuestionIndex] || [];
    if (currentSels.length === 0) {
        nextBtn.disabled = true;
        return;
    }

    let valid = true;
    currentSels.forEach(idx => {
        const opt = q.options[idx];
        if (opt.hasInput || opt.hasDynamicInput) {
            const vals = (userCustomInputs[currentQuestionIndex] || {})[idx] || [];
            // At least one input must have text
            const hasText = vals.some(v => v.trim() !== '');
            if (!hasText) valid = false;
        }
    });

    nextBtn.disabled = !valid;
}

function selectOption(optionIndex, btn, q) {
    let currentSels = userSelections[currentQuestionIndex] || [];
    const opt = q.options[optionIndex];

    if (q.type === 'single') {
        currentSels = [optionIndex];
        const buttons = optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(b => {
            b.classList.remove('selected');
            const wrap = b.querySelector('.dynamic-inputs-wrapper');
            if (wrap) wrap.style.display = 'none';
        });
        btn.classList.add('selected');
        const activeWrap = btn.querySelector('.dynamic-inputs-wrapper');
        if (activeWrap) {
            activeWrap.style.display = 'block';
            const input = activeWrap.querySelector('input');
            if (input) input.focus();
        }
    } else if (q.type === 'multiple') {
        if (currentSels.includes(optionIndex)) {
            // Deselect
            currentSels = currentSels.filter(idx => idx !== optionIndex);
            btn.classList.remove('selected');
            const wrap = btn.querySelector('.dynamic-inputs-wrapper');
            if (wrap) wrap.style.display = 'none';
        } else {
            // Select
            if (opt.isExclusive) {
                currentSels = [optionIndex];
                const buttons = optionsContainer.querySelectorAll('.option-btn');
                buttons.forEach(b => {
                    b.classList.remove('selected');
                    const wrap = b.querySelector('.dynamic-inputs-wrapper');
                    if (wrap) wrap.style.display = 'none';
                });
            } else {
                const exclusiveIdx = q.options.findIndex(o => o.isExclusive);
                if (exclusiveIdx !== -1 && currentSels.includes(exclusiveIdx)) {
                    currentSels = currentSels.filter(idx => idx !== exclusiveIdx);
                    const excBtn = optionsContainer.children[exclusiveIdx];
                    excBtn.classList.remove('selected');
                    const wrap = excBtn.querySelector('.dynamic-inputs-wrapper');
                    if (wrap) wrap.style.display = 'none';
                }

                if (q.maxSelect) {
                    let currentTotal = 0;
                    currentSels.forEach(idx => {
                        const option = q.options[idx];
                        if (option.hasDynamicInput) {
                            const dynArr = (userCustomInputs[currentQuestionIndex] || {})[idx] || [""];
                            currentTotal += dynArr.length;
                        } else {
                            currentTotal += 1;
                        }
                    });
                    if (currentTotal + 1 > q.maxSelect) {
                        alert(`최대 ${q.maxSelect}개까지만 선택할 수 있습니다.`);
                        return;
                    }
                }
            }
            currentSels.push(optionIndex);
            btn.classList.add('selected');
            const activeWrap = btn.querySelector('.dynamic-inputs-wrapper');
            if (activeWrap) {
                activeWrap.style.display = 'block';
                const input = activeWrap.querySelector('input');
                if (input) input.focus();
            }
        }
    }

    userSelections[currentQuestionIndex] = currentSels;
    checkNextButtonStatus();
}

function handleNextClick() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        // 합산 스코어 계산 (Q1 같이 score 속성이 있는 것만)
        totalScore = 0;
        userSelections.forEach((sels, qIdx) => {
            const q = questions[qIdx];
            if (q.type !== 'text') {
                sels.forEach(optIdx => {
                    const opt = q.options[optIdx];
                    if (opt && opt.score) totalScore += opt.score;
                });
            }
        });

        progressBar.style.width = `100%`;
        setTimeout(() => {
            showLoading(); // 바로 로딩(전송)으로 넘어감
        }, 300);
    }
}

function handlePrevClick() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function showLoading() {
    switchView(loadingView);

    // 각 문항의 답변을 배열로 취합 (복수선택 분리용)
    const answers = questions.map((q, qIdx) => {
        if (q.type === 'text') {
            return [userSelections[qIdx] || ''];
        } else {
            const sels = userSelections[qIdx] || [];
            let flattenedVals = [];
            sels.forEach(optIdx => {
                const opt = q.options[optIdx];
                // Q1의 경우 값 그대로(텍스트)가 아닌 1~4 숫자(score)로 치환하여 반환
                if (qIdx === 0 && opt.score) {
                    flattenedVals.push(opt.score);
                }
                // Q6의 경우 텍스트 대신 1~3 숫자 값으로 치환하여 반환
                else if (qIdx === 5) {
                    flattenedVals.push(optIdx + 1);
                }
                else if (opt.hasInput || opt.hasDynamicInput) {
                    const customVals = ((userCustomInputs[qIdx] || {})[optIdx] || []).map(v => v.trim()).filter(v => v !== '');
                    if (customVals.length > 0) {
                        customVals.forEach(cv => {
                            flattenedVals.push(opt.text + " : " + cv);
                        });
                    } else {
                        flattenedVals.push(opt.text);
                    }
                } else {
                    flattenedVals.push(opt.text);
                }
            });
            return flattenedVals; // 각 입력값을 별도 배열 아이템으로 반환
        }
    });

    // 최대 2개까지 선택 가능한 문항(Q2, Q3, Q5)은 분리하여 전송
    const payload = {
        empId: currentEmpId,
        empName: currentEmpName,
        score: totalScore,
        q1: answers[0][0] || '',
        q2_1: answers[1][0] || '',
        q2_2: answers[1][1] || '',
        q3_1: answers[2][0] || '',
        q3_2: answers[2][1] || '',
        q4: answers[3][0] || '',
        q5_1: answers[4][0] || '',
        q5_2: answers[4][1] || '',
        q6: answers[5][0] || '',
        q7: answers[6][0] || '',
        q8: answers[7][0] || ''
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

function closeWindow() {
    window.close();
    // 브라우저 보안 정책으로 인해 window.close()가 작동하지 않을 경우 안내
    setTimeout(() => {
        alert("현재 탭을 닫아주세요.");
    }, 100);
}
