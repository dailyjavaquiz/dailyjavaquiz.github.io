const { DateTime } = luxon;

const url = 'https://cuiqqdgejvevjamtmiog.supabase.co/functions/v1/daily-java-quiz'

function convertToLocalTime(dateString) {
    return DateTime.fromISO(dateString, { zone: "utc" })
        .setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
        .toFormat("yyyy-MM-dd HH:mm:ss");
}

function showLoading() {
    $('#loading-screen').fadeIn();
}

function hideLoading() {
    $('#loading-screen').fadeOut();
}

function isLocal() {
    return location.host === 'localhost:63342'
}

function processFooter() {
    $('.quiz-footer').css('display', 'flex')
}

function showInfo() {
    $.ajax({
        url: url + '?type=info',
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            userUuid: localStorage.getItem('userUuid')
        }),
        success: function (json) {
            $('.quiz-submit-footer').hide()
            $('.info').hide()

            const html = json.list.map(quiz => {
                const solvedAt = convertToLocalTime(quiz.solved_at)

                return `
                    <tr>
                        <td>${quiz.title}</td>
                        <td>${solvedAt}</td>
                    </tr>
                `
            })
                .join('')

            let quizTitle = 'quiz'

            if (json.list.length > 1) {
                quizTitle = 'quizzes'
            }

            const tableHtml = `
                <p>Your token is ${json.userUuid}<br>
                You can log in on other devices with this token and continue taking the quiz.
                Make sure to manage it carefully so that it is not exposed to others.
                </p>
                </p>You solved ${json.list.length} ${quizTitle}.</p>
                <table class="solved-quiz">
                <thead>
                    <tr>
                        <th class="solved-quiz-title">title</th>
                        <th class="solved-quiz-date">date</th>
                    </tr>
                </thead>
                <tbody>
                    ${html} 
                </tbody>
                </table>
            `

            $('.content').html(tableHtml)
            $('.title').hide()
            $('.quizUuid').val('')

            processFooter(json);
        },
        beforeSend: showLoading,
        complete: hideLoading
    })
}

function deleteSolvedQuiz() {
    $.ajax({
        url: url + '?type=deleteSolvedQuiz',
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            userUuid: localStorage.getItem('userUuid')
        }),
        success: another,
        beforeSend: showLoading,
        complete: hideLoading
    });
}

function getLanguage() {
    if (isLocal()) {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has('en')) {
            return 'en-US'
        }
    }

    return navigator.language
}

function setQuiz(json) {
    if (json.error === 'solved') {
        alert('이미 해결한 문제입니다.');
        another()
        return
    }

    if (json.error === 'empty') {
        if(confirm('You have solved all the quizzes.\nWould you like to take the quiz again?')) {
            deleteSolvedQuiz()
        } else {
            alert('Please visit again when new quizzes are updated.')
            showInfo()
        }

        return
    }

    if (json.redirect === true) {
        location.href = `${json.quizUuid}`
        return
    }

    if (getLanguage() === 'ko-KR') {
        $('.content').html(json.contentKorean)
        $('.title').html(json.titleKorean)
    } else {
        $('.content').html(json.contentEnglish)
        $('.title').html(json.titleEnglish)
    }

    $('.quizUuid').val(json.quizUuid)

    processFooter(json);

    localStorage.setItem('userUuid', json.userUuid)
}

function getQuiz() {
    const segments = location.pathname.split('/');
    const quizUuid = segments.find(segment => segment.length === 36);

    $.ajax({
        url,
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            userUuid: localStorage.getItem('userUuid'),
            quizUuid
        }),
        success: setQuiz,
        beforeSend: showLoading,
        complete: hideLoading
    })
}

function syncAnswer(source) {
    const value = $(source).val();
    $('.answer').val(value);
}

function another() {
    const anotherPath = '/another.html';

    if (isLocal()) {
        location.href = `/dailyjavaquiz.github.io${anotherPath}`
        return

    }

    location.href = anotherPath
}

function login() {
    const userUuid = prompt("Please enter your token:");

    if (userUuid.length !== 36) {
        alert('Please enter a valid token.')
        return
    }

    $.ajax({
        url: url + '?type=login',
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            userUuid
        }),
        success: function (json) {
            if (json.error == null) {
                localStorage.setItem('userUuid', json.userUuid)
                another()
            } else {
                alert(json.error)
            }
        },
        beforeSend: showLoading,
        complete: hideLoading
    })
}

function submit() {
    const $answer = $('.quiz-footer .answer');
    const answer = $answer.val();

    if (answer === '') {
        alert('Please enter the answer.')
        $answer.focus()
        return
    }

    $.ajax({
        url: url + '?type=answer',
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            userUuid: localStorage.getItem('userUuid'),
            quizUuid: $('.quizUuid').val(),
            answer
        }),
        success: function (json) {
            if (json.correct === true) {
                alert('Correct answer.')
                another()
            } else {
                alert('Wrong answer.')
            }
        },
        beforeSend: showLoading,
        complete: hideLoading
    })
}

function initEvent() {
    $('.answer').on('input', function () {
        syncAnswer(this)
    })

    $('body').on('click', '.answer[readonly]', function () {
        $('.quiz-footer .answer').focus()
    })

    $('.another').on('click', function () {
        another()
    })

    $('.info').on('click', function () {
        showInfo()
    })

    $('.login').on('click', function () {
        login()
    })

    $('.submit').on('click', function () {
        submit()
    })

    $('.home').on('click', function () {
        if (isLocal()) {
            location.href = '/dailyjavaquiz.github.io'
            return
        }

        location.href = '/'
    })
}

function init() {
    $('body').append(`
        <div id="loading-screen" style="display: none;">
          <div class="spinner"></div>
        </div>
        
        <div class="quiz">
            <h1 class="title"></h1>
            <div class="content"></div>
            <input type="hidden" class="quizUuid">
        </div>
    
        <div class="quiz-footer">
            <div class="quiz-submit-footer">
                <div>Please enter an English word.</div>
                <input type="text" class="answer" placeholder="Enter the answer." size="17">
                <button type="button" class="submit">send</button>
            </div>            
            <div class="quiz-navigator-footer">
                <button type="button" class="link-button home">home</button>
                <button type="button" class="link-button another">Another quiz</button>
                <button type="button" class="link-button info">Info</button>
                <button type="button" class="link-button login">Login</button>
            </div>
        </div>
    `)

    initEvent()
}

function isIndex() {
    return location.pathname === '/'
        || location.pathname === '/index.html'
        || location.pathname === '/dailyjavaquiz.github.io/'
        || location.pathname === '/dailyjavaquiz.github.io/index.html';
}

if (isIndex()) {
    processFooter()
    initEvent()
} else {
    init()
    getQuiz()
}


