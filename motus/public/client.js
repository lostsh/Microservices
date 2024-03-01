// public/client.js
var nbTry = 0;

$(document).ready(function(){
    $('#guessForm').on('submit', function(event){
        nbTry++;

        event.preventDefault(); // Prevent default form submission

        // Get user guess
        var guess = $('#guess').val();

        // Fetch word for the day from server
        $.get('/guess/' + guess, function(result){
            // Display the result
            $('#result').html(result);

        });
    });
});

