// public/client.js

$(document).ready(function(){
    let isCorrect = false;
    let username = '';
    let scoring = null;

    $.get('/wordLength', function(result){
        $('#wordLength').html(result.tmp1);
        $('#tryNumber').html(result.tmp2);
    });
    
    $('#guessForm').on('submit', function(event){
        // Récupérer la devinette de l'utilisateur
        var guess = $('#guess').val();

        // Récupérer le résultat depuis le serveur en fonction de la devinette de l'utilisateur
        $.get('/guess/' + guess, function(result){
            // Afficher le résultat
            $('#result').html(result.result);
            $('#tryNumber').html(result.tryNumber1  );
            username = result.username;

            if (result.tryNumber1 > 6 || result.isCorrect) {
                $('#guessForm button[type="submit"]').prop('disabled', true);
                scoring = result.scoring;
                $('#specialButton').show();
            }
        });

        // Empêcher le formulaire de se soumettre normalement
        event.preventDefault();
    });

    $('#specialButton').on('click', function() {
        // Appeler la fonction displayScores() avec le score récupéré

        $.get('/userstats/' ,function(scoring){
            
            // Afficher le résultat
            displayScores(scoring);
        });
        
    });
});

