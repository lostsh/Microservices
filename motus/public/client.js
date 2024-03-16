// public/client.js
var nbTry = 0;

$(document).ready(function(){
    $('#guessForm').on('submit', function(event){
        event.preventDefault(); // Prevent default form submission

        // Get user guess
        var guess = $('#guess').val();

        url = '/guess/' + guess;

        // Fetch word for the day from server
        $.get(url, function(result){
            // Display the result
            $('#result').html(result);

        });
    });
});

// when the buttn with id="view_score" is clicked
function viewScore() {
    // Get user from session
    let user = $('#score')[0].innerHTML;
    // Fetch score from server
    
    const URL_GETSCORE = 'http://localhost:3001/getscore';
    $.ajax({
        url: URL_GETSCORE,
        method: 'GET',
        data: { player: user },
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        success: function(score) {
            // Display the result
            let res = "<p>Nb Word(s) found: " + score.score_nb_words + "</p>";
            res += "<p>Average try: " + (score.score_nb_try / score.score_nb_words).toFixed(2) + "</p>";
            $('#score').html(res);
            $('#score').css('visibility', 'visible');
            $('#view_score').css('visibility', 'hidden');
        }
    });
}

