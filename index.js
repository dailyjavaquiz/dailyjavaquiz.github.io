function setQuiz(json) {
    $('.content').html(json.content);
    $('.title').html(json.title);
    $('.quizUuid').html(json.quizUuid);
    localStorage.setItem('userUuid', json.userUuid)
}

const url = 'https://cuiqqdgejvevjamtmiog.supabase.co/functions/v1/daily-java-quiz';

function getQuiz() {
    $.ajax({
        url,
        method: 'POST',
        dataType: 'json',
        data: {
            userUuid: localStorage.getItem('userUuid')
        },
        success: setQuiz
    });
}

getQuiz();

let $answer = $('.answer');

function syncAnswer(source) {
    var value = $(source).val();
    $answer.val(value);
}

$answer.on('input', function() {
    syncAnswer(this);
})
.on('keydown', function(event) {
    const $this = $(this)
    const answer = $this.val()

    if (answer === '') {
        alert('정답을 입력하세요.')
        return
    }

    if (event.key === 'Enter') {
        $.ajax({
            url,
            method: 'POST',
            dataType: 'json',
            data: {
                userUuid: localStorage.getItem('userUuid'),
                quizUuid: $('.quizUuid').val(),
                answer: $this.val()
            },
            success: function(json) {
                if (json.correct === true) {
                    alert('정답입니다.')
                    getQuiz()
                } else {
                    alert('틀렸습니다.')
                }
            }
        });
    }
})
