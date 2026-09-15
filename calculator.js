import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const screen = document.getElementById("screen");
const welcomeUser = document.getElementById("welcomeUser");
const logoutButton = document.getElementById("logoutButton");
const historyContainer = document.getElementById("history");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const protectedContent = document.getElementById("protectedContent");

let currentUser = null;


/* =====================================================
   AUTHENTICATION CHECK
===================================================== */

onAuthStateChanged(auth, async (user) => {

    console.log("Auth state:", user);

    if (!user) {

        console.log("No user logged in. Redirecting...");

        window.location.href = "login.html";

        return;
    }


    console.log("User is logged in:", user.email);

    currentUser = user;


    if (protectedContent) {
        protectedContent.classList.remove("hidden");
    }


    if (welcomeUser) {

        welcomeUser.textContent =
            `Welcome, ${user.displayName || user.email}`;

    }


    await loadHistory();

});


/* =====================================================
   CALCULATOR FUNCTIONS
===================================================== */

window.appendValue = function(value) {

    if (!currentUser) return;

    screen.value += value;

};


window.clearDisplay = function() {

    screen.value = "";

};


window.deleteLast = function() {

    screen.value =
        screen.value.slice(0, -1);

};


/* =====================================================
   CALCULATE
===================================================== */

window.calculate = async function() {

    if (!currentUser) {

        window.location.href = "login.html";

        return;

    }


    try {

        let expression =
            screen.value.trim();


        if (expression === "") {
            return;
        }


        const originalExpression =
            expression;


        expression =
            expression.replace(/\^/g, "**");


        if (
            !/^[0-9+\-*/%.() *]+$/.test(expression)
        ) {

            throw new Error(
                "Invalid characters"
            );

        }


        const result =
            Function(
                `"use strict"; return (${expression})`
            )();


        if (!Number.isFinite(result)) {

            throw new Error(
                "Invalid calculation"
            );

        }


        screen.value = result;


        await saveCalculation(
            originalExpression,
            result
        );


    } catch (error) {

        console.error(
            "Calculation error:",
            error
        );

        screen.value = "Error";

    }

};


/* =====================================================
   SAVE CALCULATION
===================================================== */

async function saveCalculation(
    expression,
    result
) {

    if (!currentUser) return;


    try {

        await addDoc(
            collection(
                db,
                "calculations"
            ),
            {

                userId:
                    currentUser.uid,

                expression:
                    expression,

                result:
                    result,

                createdAt:
                    serverTimestamp()

            }
        );


        await loadHistory();


    } catch (error) {

        console.error(
            "Error saving calculation:",
            error
        );

    }

}


/* =====================================================
   LOAD HISTORY
===================================================== */

async function loadHistory() {

    if (!currentUser) return;


    historyContainer.innerHTML = `
        <p class="text-gray-400">
            Loading history...
        </p>
    `;


    try {

        const q =
            query(
                collection(
                    db,
                    "calculations"
                ),

                where(
                    "userId",
                    "==",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(q);


        if (snapshot.empty) {

            historyContainer.innerHTML = `
                <div class="text-center py-10">

                    <p class="text-gray-400">
                        No calculations yet.
                    </p>

                    <p class="text-gray-500 text-sm mt-2">
                        Your calculations will appear here.
                    </p>

                </div>
            `;

            return;

        }


        const calculations =
            snapshot.docs.map(
                calculation => ({

                    id:
                        calculation.id,

                    ...calculation.data()

                })
            );


        calculations.sort(
            (a, b) => {

                const timeA =
                    a.createdAt?.toMillis?.() || 0;

                const timeB =
                    b.createdAt?.toMillis?.() || 0;

                return timeB - timeA;

            }
        );


        historyContainer.innerHTML = "";


        calculations.forEach(
            calculation => {


                const historyItem =
                    document.createElement(
                        "div"
                    );


                historyItem.className =
                    "bg-gray-700 rounded-xl p-4 flex justify-between items-center gap-3";


                const left =
                    document.createElement(
                        "div"
                    );


                const expression =
                    document.createElement(
                        "p"
                    );


                expression.className =
                    "text-gray-300 text-lg";


                expression.textContent =
                    calculation.expression;


                const result =
                    document.createElement(
                        "p"
                    );


                result.className =
                    "text-green-400 text-xl font-bold";


                result.textContent =
                    `= ${calculation.result}`;


                left.appendChild(
                    expression
                );

                left.appendChild(
                    result
                );


                const deleteButton =
                    document.createElement(
                        "button"
                    );


                deleteButton.className =
                    "text-red-400 hover:text-red-300 text-sm";


                deleteButton.textContent =
                    "Delete";


                deleteButton.addEventListener(
                    "click",
                    async () => {

                        await deleteCalculation(
                            calculation.id
                        );

                    }
                );


                historyItem.appendChild(
                    left
                );

                historyItem.appendChild(
                    deleteButton
                );


                historyContainer.appendChild(
                    historyItem
                );

            }
        );


    } catch (error) {

        console.error(
            "Error loading history:",
            error
        );


        historyContainer.innerHTML = `
            <div class="text-center py-10">

                <p class="text-red-400">
                    Could not load calculation history.
                </p>

            </div>
        `;

    }

}


/* =====================================================
   DELETE ONE CALCULATION
===================================================== */

async function deleteCalculation(
    calculationId
) {

    if (!currentUser) return;


    try {

        await deleteDoc(
            doc(
                db,
                "calculations",
                calculationId
            )
        );


        await loadHistory();


    } catch (error) {

        console.error(
            "Error deleting calculation:",
            error
        );

    }

}


/* =====================================================
   CLEAR ALL HISTORY
===================================================== */

if (clearHistoryButton) {

    clearHistoryButton.addEventListener(
        "click",
        async () => {

            if (!currentUser) return;


            const confirmed =
                confirm(
                    "Are you sure you want to delete all your calculation history?"
                );


            if (!confirmed) return;


            try {

                const q =
                    query(
                        collection(
                            db,
                            "calculations"
                        ),

                        where(
                            "userId",
                            "==",
                            currentUser.uid
                        )
                    );


                const snapshot =
                    await getDocs(q);


                for (
                    const calculation
                    of snapshot.docs
                ) {

                    await deleteDoc(
                        calculation.ref
                    );

                }


                await loadHistory();


            } catch (error) {

                console.error(
                    "Error clearing history:",
                    error
                );


                alert(
                    "Could not clear calculation history."
                );

            }

        }
    );

}


/* =====================================================
   LOGOUT
===================================================== */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}