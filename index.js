const { DateTime } = luxon;
const localPath = 'dailyjavaquiz.github.io'
let nextQuizUuid;

const url = 'https://cuiqqdgejvevjamtmiog.supabase.co/functions/v1/daily-java-quiz-dev'

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

            if (json.userUuid !== undefined) {
                localStorage.setItem('userUuid', json.userUuid)
            }

            const html = json.list.map(quiz => {
                const solvedAt = convertToLocalTime(quiz.solved_at)

                let path = '/'

                if (isLocal()) {
                    path += `${localPath}/`
                }

                path += quiz.uuid

                return `
                    <tr>
                        <td><a href="${path}">${quiz.title}</a></td>
                        <td>${solvedAt}</td">
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
            $('.home').show()
            $('.quizUuid').val('')

            processFooter(json);
        },
        beforeSend: showLoading,
        complete: hideLoading
    })
}

function deleteSolvedQuiz() {
    $.ajax({
        url: url + '?type=restart',
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            userUuid: localStorage.getItem('userUuid')
        }),
        success: function () {
            getNextUnsolvedQuiz()
        },
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

function isKorean() {
    return getLanguage() === 'ko-KR';
}


function setQuiz(json) {
    nextQuizUuid = json.nextQuizUuid

    if (checkNextQuiz()) {
        if (isKorean()) {
            $('.content').html(json.contentKorean)
            $('.title').html(json.titleKorean)
        } else {
            $('.content').html(json.contentEnglish)
            $('.title').html(json.titleEnglish)
        }

        $('.quizUuid').val(json.quizUuid)

        processFooter(json);

        if (json.userUuid !== undefined) {
            localStorage.setItem('userUuid', json.userUuid)
        }
    }
}

function getUnsolvedQuiz() {
    const segments = location.pathname.split('/');
    const quizUuid = segments.find(segment => segment.length === 36);

    $.ajax({
        url: url + '?type=getUnsolvedQuiz',
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            userUuid: localStorage.getItem('userUuid'),
            quizUuid
        }),
        success: setQuiz,
        beforeSend: showLoading,
        complete: function () {
            hideLoading()
            const content = $('content').html()
            sessionStorage.setItem("content", content);
        }
    })
}

function getNextUnsolvedQuiz() {
    $.ajax({
        async: false,
        url: url + '?type=getNextUnsolvedQuiz',
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            userUuid: localStorage.getItem('userUuid')
        }),
        beforeSend: function () {
            $('.quiz-footer').hide()
        },
        success: function (reqJson) {
            nextQuizUuid = reqJson.quizUuid
        },
        complete: function () {
            $('.quiz-footer').show()
        }
    })
}

function syncAnswer(source) {
    const value = $(source).val();
    $('.answer').val(value);
}

function checkNextQuiz() {
    if (nextQuizUuid === 'empty') {
        if (confirm('You have solved all the quizzes.\nDo you want to delete all quiz progress and take the quiz again?')) {
            deleteSolvedQuiz()
            home()
            return false
        }

        alert('Please visit again when new quizzes are updated.')
        home()

        return false
    }

    return true
}

function another() {
    if (checkNextQuiz()) {
        if (isLocal()) {
            location.href = `/${localPath}/${nextQuizUuid}`
        } else {
            location.href = `/${nextQuizUuid}`
        }
    }
}

function login() {
    const userUuid = prompt("Please enter the token found on the My page.");

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
                if (json.userUuid !== undefined) {
                    localStorage.setItem('userUuid', json.userUuid)
                }
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
                nextQuizUuid = json.nextQuizUuid
                another()
            } else {
                alert('Wrong answer.')
            }
        },
        beforeSend: showLoading,
        complete: hideLoading
    })
}

function hint() {
    $.ajax({
        url: url + '?type=hint',
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            quizUuid: $('.quizUuid').val()
        }),
        success: function (json) {
            alert(json)
        },
        beforeSend: showLoading,
        complete: hideLoading
    })
}

function home() {
    if (isLocal()) {
        location.href = `/${localPath}`
        return
    }

    location.href = '/'
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
        home()
    })

    $('.hint').on('click', function () {
        hint()
    })
}

function init() {
    $('body').append(`
        <div id="loading-screen" style="display: none;">
          <div class="spinner"></div>
        </div>
        <div class="logo">Daily Java-Backend Quiz</div>
        
        <div class="quiz-content">
            <div class="quiz">
                <h1 class="title"></h1>
                <div class="content"></div>
                <input type="hidden" class="quizUuid">
            </div>
        
            <div class="quiz-footer">
                <div class="quiz-submit-footer">
                    <div class="info-message">Please enter an English word.</div>
                    <input type="text" class="answer" placeholder="Enter the answer." size="17">
                    <button type="button" class="submit">send</button>
                    <button type="button" class="hint">hint</button>
                </div>            
                <div class="quiz-navigator-footer">
                    <button type="button" class="link-button home">Home</button>
                    <button type="button" class="link-button another">Another quiz</button>
                    <button type="button" class="link-button info">My</button>
                    <button type="button" class="link-button login">Login</button>
                </div>
            </div>
        </div>    
    `)

    initEvent()
}

function isIndex() {
    return location.pathname === '/'
        || location.pathname === '/index.html'
        || location.pathname === `/${localPath}/`
        || location.pathname === `/${localPath}/index.html`;
}

window.addEventListener("pageshow", function(event) {
    if (event.persisted) {
        restoreAjaxContent()
    } else {
        loadAjaxContent()
    }
});

window.addEventListener("popstate", function() {
    restoreAjaxContent();
});

function loadAjaxContent() {
    if (isIndex()) {
        $('.home').hide()
        processFooter()
        initEvent()

        let userUuid = localStorage.getItem('userUuid')

        if (userUuid == null) {
            $.ajax({
                url: url + '?type=home',
                method: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({}),
                success: function (json) {
                    userUuid = json.userUuid
                    localStorage.setItem('userUuid', userUuid)
                },
            })
        }

        getNextUnsolvedQuiz()
    } else {
        init()
        getUnsolvedQuiz()
    }

    if (isKorean()) {
        $('.info-message').show()
    } else {
        $('.info-message').hide()
    }
}

function restoreAjaxContent() {
    let storedData = sessionStorage.getItem("quiz-content");

    if (storedData) {
        $(".quiz-content").html(storedData)
    } else {
        loadAjaxContent()
    }
}

