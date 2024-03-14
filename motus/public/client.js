// public/client.js
var nbTry = 0;

$(document).ready(function(){
    $('#guessForm').on('submit', function(event){
        const { code, username } = req.query

        nbTry++;

        event.preventDefault(); // Prevent default form submission

        // Get user guess
        var guess = $('#guess').val();

        url = '/guess/' + guess + '?username=' + username + '&code=' + code;
        //url = '/guess/' + guess;
        console.log(url);

        // Fetch word for the day from server
        /*
        $.get(url, function(result){
            // Display the result
            $('#result').html(result);

        });
        */
    });
});

