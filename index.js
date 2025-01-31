const url = 'https://cuiqqdgejvevjamtmiog.supabase.co/functions/v1/daily-java-quiz'

function isLocal() {
    return location.host === 'localhost:63342'
}

function processFooter(json) {
    if (json.isKorean === true) {
        $('.quiz-footer .answer').attr('placeholder', '정답을 입력하세요.')
        $('.quiz-footer .submit').text('정답 확인하기')
        $('.quiz-footer .another').text('다른 문제보기')
        $('.quiz-footer .solved').text('해결한 문제')
    } else {
        $('.quiz-footer .answer').attr('placeholder', 'Enter the answer.')
        $('.quiz-footer .submit').text('Check the answer')
        $('.quiz-footer .another').text('Another question')
        $('.quiz-footer .solved').text('Solved question')
    }

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

function showSolvedQuiz() {
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
            $('button.solved').hide()

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
                You solved ${json.list.length} question(s).
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
        }
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
        success: another
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
            showSolvedQuiz()
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
    $('.quiz').addClass('quiz-loading-complete')

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
        success: setQuiz
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
        <div class="quiz">
            <h1 class="title"></h1>
            <div class="content"></div>
            <input type="hidden" class="quizUuid">
        </div>
    
        <div class="quiz-footer">
            <div class="quiz-submit-footer">
                <input type="text" class="answer" placeholder="" size="15">
                <button type="button" class="submit"></button>
            </div>
            <div class="quiz-navigator-footer">
                <button type="button" class="another"></button>
                <button type="button" class="solved"></button>
            </div>
        </div>
    `)

    $answer.on('input', function() {
        syncAnswer(this);
    })

    $('.another').on('click', function () {
        another()
    })

    $('.solved').on('click', function () {
       showSolvedQuiz()
    })

    $('.submit').on('click', function () {
        const $answer = $('.quiz-footer .answer');
        const answer = $answer.val();

        if (answer === '') {
            alert('정답을 입력하세요.')
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
            }
        })
    })
}

init()
getQuiz()
