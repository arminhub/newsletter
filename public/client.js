// selektors
const email = document.querySelector('#email');
const checkbox = document.querySelector('#checkbox');
const submit = document.querySelector('#submit');
const label = document.querySelector('label');

// postData Funktion
const postData = (e) => {
    e.preventDefault();

    let reqData = {
        method: 'post',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: `email=${email.value}`
    };
    fetch("http://localhost:7001/newsletter", reqData)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.check) {
                fetch("http://localhost:7001/bestaetigung")
                    .then(response => response.text())
                    .then(data => document.body.innerHTML = data)
            } else {
                label.style.color = '#FF0000';
                label.innerHTML = 'Email-Adresse richtig eingeben';
                // email.value = '';
            }
        })
        .catch(error => console.log('error', error));

}

// checkHandler Funktion
const checkHandler = () => {
    console.log('checkHandler ok')
    if (email.value !== '' && checkbox.checked) {
        submit.removeAttribute('disabled');
        submit.classList.remove('disabled');
        submit.classList.add('btn');
    } else {
        submit.setAttribute('disabled', true);
        submit.classList.add('disabled');
    }
}

// EventListener
email.addEventListener('input', checkHandler);
checkbox.addEventListener('change', checkHandler);
submit.addEventListener('click', postData);
