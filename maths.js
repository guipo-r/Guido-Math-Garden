var answer;
var score = 0;
var backgroundImages = [];

// Hago una funcion para que se genere una nueva suma cada vez. n1 tiene que estar entre 0 y 4, y n2 tiene que estar entre 0 y 5. Como son decimales, hay que redondearlos a un entero.
// La funcion Math.random genera valores entre 0 y 1, por eso se los multiplica por 5 (que nunca me va a dar mayor a 4), y por 6 (que nunca me va a dar mayor a 5).

function nextQuestion() {
    const n1 = Math.floor(Math.random() * 5);
    document.getElementById('n1').innerHTML = n1;
    const n2 = Math.floor(Math.random() * 6);
    document.getElementById('n2').innerHTML = n2;
    answer = n1 + n2;
};

// Funcion para controlar que la respuesta sea igual a la prediccion de mi modelo
function checkAnswer() {
    const prediction = predictImage();
    console.log(`Answer: ${answer}, Prediction: ${prediction}`);

    if (prediction == answer) {
        score++;
        if (score < 7) {
            console.log(`Correct! Score: ${score}`);
            backgroundImages.push(`url('images/background${score}.svg')`);
            document.body.style.backgroundImage = backgroundImages;
        } else {
            alert('Congratulations! You made it!');
            score = 0;
            backgroundImages = [];
            document.body.style.backgroundImage = backgroundImages;
        };

    } else {
        if (score != 0) { score--; }
        console.log(`Wrong! Score ${score}`);
        alert('Maybe try to draw a clear figure');
        setTimeout(function () {
            backgroundImages.pop();
            document.body.style.backgroundImage = backgroundImages;
        }, 500);
    };

};
