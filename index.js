$.ajax({
    url: 'https://cuiqqdgejvevjamtmiog.supabase.co/functions/v1/daily-java-quiz',
    method: 'POST',
    dataType: 'json',
    data: {
        userUuid: localStorage.getItem('userUuid')
    },
    success: function(json) {
        $('.content').html(json.content);
        $('.title').html(json.title);
        localStorage.setItem('userUuid', json.userUuid)
    },
    error: function(xhr, status, error) {
        console.error('Error:', error);
    }
});
