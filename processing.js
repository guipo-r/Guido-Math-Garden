var model; //Defino model aca y no dentro de async function para que sea una variable global y pueda usarla para hacer predicciones al final

async function loadModel() {
    model = await tf.loadGraphModel('TFJS/model.json')
}


function predictImage() {
    console.log('Processing...');

    //Guardo imagen del canvas y la paso a escala de grises. Modifico el umbral para que en vez de gris, guarde las lineas como blancas
    let image = cv.imread(canvas);
    cv.cvtColor(image, image, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(image, image, 150, 255, cv.THRESH_BINARY);

    //Extraigo los contornos de la imagen
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(image, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    
    //A partir de los contornos, determino el rectangulo minimo que incluya a los contornos (boundingRect) y lo recorto (roi)
    let cnt = contours.get(0);
    let rect = cv.boundingRect(cnt);
    image = image.roi(rect);

    //Re-escalo rectangulo para que me quede con altura o ancho de 20px, alguno de las dos dimensiones tiene que ser 20px
    var height = image.rows;
    var width = image.cols;

    if (height > width) {
        height = 20;
        const scaleFactor = image.rows / height;
        width = Math.round(image.cols / scaleFactor);
    
    } else {
        width = 20;
        const scaleFactor = image.columns / width;
        height = Math.round(image.rows / scaleFactor);
    }

    let newSize = new cv.Size(width, height);
    cv.resize(image, image, newSize, 0, 0, cv.INTER_AREA);

    //Calculamos los nuevos margenes para que la imagen final quede cuadrada (agregamos el padding)
    const LEFT = Math.ceil(4 + (20 - width)/2); //Math.ceil redondea la cifra para arriba
    const RIGHT = Math.floor(4 + (20 - width)/2); //Math.floor redondea la cifra para abajo
    const TOP = Math.ceil(4 + (20 - height)/2);
    const BOTTOM = Math.floor(4 + (20 - height)/2);

    // console.log(`top: ${TOP}, bottom: ${BOTTOM}, left: ${LEFT}, right: ${RIGHT}`);

    const BLACK = new cv.Scalar (0,0,0,0); //Establezco una constante que sea el color negro, para usarla como color del borde en el padding
    cv.copyMakeBorder(image, image, TOP, BOTTOM, LEFT, RIGHT, cv.BORDER_CONSTANT, BLACK);

    // Centre of Mass
    cv.findContours(image, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    cnt = contours.get(0);
    const Moments = cv.moments(cnt, false);

    const cx = Moments.m10 / Moments.m00; //calculo coordenadas de x e y para el centro de masa de la imagen
    const cy = Moments.m01 / Moments.m00;
    // console.log(`M00: ${Moments.m00}, cx: ${cx}, cy: ${cy}`);

    const X_SHIFT = Math.round(image.cols/2.0 - cx); //muevo el centro de masa de la imagen a la posicion del centro de la imagen
    const Y_SHIFT = Math.round(image.rows/2.0 - cy);

    newSize = new cv.Size(image.cols, image.rows);
    const M = cv.matFromArray(2,3, cv.CV_64FC1, [1, 0, X_SHIFT, 0, 1, Y_SHIFT]);
    cv.warpAffine(image, image, M, newSize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, BLACK);

    // Normalizacion de los pixeles. Los quiero entre 0 y 1, entonces los tengo que dividir por 255
    // Primero me fijo como son los valores antes del a transformacion. Los puedo llamar en la consola de la pagina

    let pixelValues = image.data;
    // console.log(`pixel values: ${pixelValues}`);
    
    pixelValues = Float32Array.from(pixelValues); //convierto los pixeles de int a float, para poder dividirlos bien por 255 y que no me den 0 o 1 unicamente

    pixelValues = pixelValues.map(function(item) { //Para que la funcion se aplique a todo el array, hay que usar la funcion map
        return item / 255;
    });

    // console.log(`scaled array: ${pixelValues}`);

    //Creando el Tensor
    const X = tf.tensor([pixelValues]);
    // console.log(`Shape of Tensor: ${X.shape}`);
    // console.log(`dtype of Tensor: ${X.dtype}`);

    //Hacer prediccion usando imagen del canvas, recordar que nuestro modelo ya esta cargado como 'model' arriba de todo
    const result = model.predict(X);
    result.print();

    // console.log(tf.memory());
    
    const output = result.dataSync()[0];

    // Testing Only (BORRAR DESPUES)
    // const outputCanvas = document.createElement('CANVAS');
    //cv.imshow(outputCanvas, image);
    // document.body.appendChild(outputCanvas);



    
    // Cleanup

    image.delete();
    contours.delete();
    cnt.delete();
    hierarchy.delete();
    M.delete();
    X.dispose();
    result.dispose();


    return output; //Tiene que estar al final, para asegurarse de que se corra todo el codigo previo

}