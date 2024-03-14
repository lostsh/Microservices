// public/client.js
var nbTry = 0;

$(document).ready(function(){
    $('#guessForm').on('submit', function(event){

        nbTry++;

        event.preventDefault(); // Prevent default form submission

        // Get user guess
        var guess = $('#guess').val();

        url = '/guess/' + guess;
        console.log(url);

        // Fetch word for the day from server
        $.get(url, function(result){
            // Display the result
            $('#result').html(result);

        });
    });
});

