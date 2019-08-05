
/* Check if login details exist */
function checkLogin() {
    var username = document.loginform.username.value.toLowerCase();
    var meterId = document.loginform.meterid.value;
    var users = db.collection('users').doc(username);
    var meterList = [];

    getDoc = users.get().then(doc => {
        if (doc.exists) {
            meterList = doc.data().meters;
            if (meterList.includes(meterId)) {
                //window.location.href = "chart.html";
                document.getElementById("loginbutton").style = "display: none";
                document.getElementById("userlogged").innerHTML = "WELCOME " + username;
                document.getElementById("userlogged1").style = "display: block";
                document.getElementById("dashboard").style = "display: block";
                document.getElementById('id01').style = "display: none";
            } else {
                alert("Does not exist");
            };
        } else {
            alert("Does not exist");
        }
    })
    .catch(err => {
        console.log('Error getting document', err);
    });
};

/*-----// end. section //-----*/


/* Get data for chart */
function getData() {
    //alert("working");
    var meterId = document.loginform.meterid.value;
    //var meter = db.collection('meters').doc(meterId).collection('readings');

    db.collection("meters").doc(meterId).collection('readings').get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            // doc.data() is never undefined for query doc snapshots
            //console.log(doc.id, " => ", doc.data());
        });
    });

    // meter.get().then(function(doc) {
    //     if (doc.exists) {
    //         console.log(doc.data());
    //     } else {
    //         console.log("No such document!");
    //     }
    // })
    // .catch(err => {
    //     console.log('Error getting document', err);
    // });
};


// const userList = document.querySelector('#user-list');

// function renderUser(doc){
//     let li = document.createElement('li');
//     let meter = document.createElement('span');

//     li.setAttribute('data-id', doc.id);
//     meter.textContent = doc.data().meters;

//     li.appendChild(meter);
    
//     userList.appendChild(li);
// }

// db.collection('users').get().then((snapshot) => {
//     snapshot.docs.forEach(doc => {
//         renderUser(doc);
//     })
// })