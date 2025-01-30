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
}

function setQuiz(json) {
    $('.content').html(json.content);
    $('.title').html(json.title);
    $('.quizUuid').val(json.quizUuid);

    processFooter(json);

    localStorage.setItem('userUuid', json.userUuid)
}

const url = 'https://cuiqqdgejvevjamtmiog.supabase.co/functions/v1/daily-java-quiz';

function getQuiz() {
    $.ajax({
        url,
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            userUuid: localStorage.getItem('userUuid')
        }),
        success: setQuiz
    })
}

let $answer = $('.answer');

function syncAnswer(source) {
    var value = $(source).val();
    $answer.val(value);
}

$answer.on('input', function() {
    syncAnswer(this);
})

$('.another').on('click', function () {
    location.reload()
})

$('.solved').on('click', function () {
    $.ajax({
        url: url + '?type=solved',
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            userUuid: localStorage.getItem('userUuid')
        }),
        success: function (json) {
            const html = json.list.map(quiz => {
                return `<tr><td>${quiz.title}</td></tr>`
            })
            .join('')

            $('.content').html(`<table>${html}</table>`);
            $('.title').html('');
            $('.quizUuid').val('');

            processFooter(json);
        }
    })
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
        url,
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
                alert('정답입니다.')
                location.reload()
            } else {
                alert('틀렸습니다.')
            }
        }
    })
})

getQuiz()
