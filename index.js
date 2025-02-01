const url = 'https://cuiqqdgejvevjamtmiog.supabase.co/functions/v1/daily-java-quiz'

function showLoading() {
    $('#loading-screen').fadeIn();
}

function hideLoading() {
    $('#loading-screen').fadeOut();
}

function isLocal() {
    return location.host === 'localhost:63342'
}

function processFooter(json) {
    $('.quiz-footer').css('display', 'flex')
}

function convertToLocalTime(dateString) {
    const date = new Date(dateString);

    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }

    const localDate = date.toLocaleString('en-US', options)
    const [month, day, year, hour, minute, second] = localDate.split(/[/, :]+/)
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

function showInfo() {
    $.ajax({
        url: url + '?type=solved',
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
                const createdAt = convertToLocalTime(quiz.created_at)

                return `
                    <tr>
                        <td>${quiz.title}</td>
                        <td>${createdAt}</td>
                    </tr>
                `
            })
                .join('')

            const tableHtml = `
                <p>Your token is ${json.userUuid}<br>
                You can log in on other devices with this token and continue taking the quiz.
                Make sure to manage it carefully so that it is not exposed to others.
                </p>
                </p>You solved ${json.list.length} question(s).</p>
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

    $('.content').html(json.content)
    $('.title').html(json.title)
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

let $answer = $('.answer');

function syncAnswer(source) {
    var value = $(source).val();
    $answer.val(value);
}

function another() {
    if (isLocal()) {
        location.href = '/dailyjavaquiz.github.io'
        return
    }

    location.href = '/'
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
                <input type="text" class="answer" placeholder="Enter the answer." size="15">
                <button type="button" class="submit">Check the answer</button>
            </div>
            <div class="quiz-navigator-footer">
                <button type="button" class="another">Another quizzes</button>
                <button type="button" class="info">Info</button>
                <button type="button" class="login">Login</button>
            </div>
        </div>
    `)

    $answer.on('input', function() {
        syncAnswer(this);
    })

    $('.another').on('click', function () {
        another()
    })

    $('.info').on('click', function () {
       showInfo()
    })

    $('.login').on('click', function () {
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
    })

    $('.submit').on('click', function () {
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
            success: function(json) {
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
    })
}

init()
getQuiz()
