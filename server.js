'use strict';
const Hapi = require('hapi');
const Joi = require('Joi');
const mysql = require('mysql');

// const connection = mysql.createConnection({
//     host: 'us-cdbr-iron-east-01.cleardb.net',
//     user: 'b2bb976c0a2130',
//     password: 'ac48b282',
//     database: 'heroku_794a7ba6903323e'
// })

// connection.connect(function (err) {

//     if (err) {
//         console.error('error connecting:' + err.stack);
//         return;
//     }
//     console.log('connected as id' + connection.threadId);
// });

const conpool = mysql.createPool({
    connectionLimit : 5,
    host     : 'us-cdbr-iron-east-01.cleardb.net',
    user     : 'b2bb976c0a2130',
    password : 'ac48b282',
    database : 'heroku_794a7ba6903323e',
    debug    : false
})

// Create a server with a host and port
const server = Hapi.server({
    host: 'localhost',
    port: 8000,
    routes: {
        cors: true
    }
});

// add the route
server.route({
    method: 'GET',
    path: '/jobs',
    handler: (request, h) => {

        // let strsql = '*'

        return new Promise((resolve, reject) => {
            conpool.getConnection(function(err,connection){
                if (err) {
                    reject(err);
                }
                connection.query('SELECT * FROM jobs', function (error, results, fields) {
                connection.release();
                if (error) {
                    reject(error)
                } else {

                    resolve({
                        jobs: results.map(row => {
                            return{
                                ID: row.ID,
                                jobTargetDate: row.jobtargetdate,
                                appSubmittedTo: row.appsubmittedto,
                                interviewDate1: row.interviewdate1,
                                notesOfInterview1: row.notesofinterview1,
                                offer: row.offer,
                                salary: row.salary

                            }
                        })
                    }
                    );
                }
            })

            })
        })

    }
})

//insert
server.route({
    config: {
        cors: {
            origin: ['*'],
            additionalHeaders: ['cache-control', 'x-requested-with']
        }
    },
    method: "POST",
    path: '/jobs',
    handler: (request, h) => {
        // const newJob=request.payload
        return new Promise(function (resolve, reject) {
            conpool.getConnection(function (err, connection) {
                if (err) {
                    reject(err)
                }
                const post = {
                    jobtargetdate: request.payload.jobTargetDate,
                    appsubmittedto: request.payload.appSubmittedTo,
                    interviewdate1: request.payload.interviewDate1,
                    notesofinterview1: request.payload.notesOfInterview1,
                    offer: request.payload.offer,
                    salary: request.payload.salary
                }
                 connection.query('Insert INTO jobs SET ?', post,
                    function (error, results, fields) {
                        connection.release();
                        if (error) {
                            reject(error)
                        }
                        else {
                            resolve(h.response().code(201));
                        }
                    }
                )

            })
        })
    }
});

server.route({
    method: 'PUT',
    path: '/jobs/{ID}',
    handler: (request, h) => {

        let jobID = request.params.ID;
        return new Promise(function (resolve, reject) {
            conpool.getConnection(function (err, connection) {
                if (err) {
                    console.error(err)
                    reject(err)
                }
                const { jobTargetDate, appSubmittedTo, interviewDate1, notesOfInterview1, offer, salary } = request.payload;
                const arraylist = [ jobTargetDate, appSubmittedTo, interviewDate1, notesOfInterview1, offer, salary, jobID ];
                const query = connection.query('UPDATE jobs SET jobtargetdate = ?, appsubmittedto = ?, interviewdate1 = ?, notesofinterview1 = ?, offer = ?, salary = ? WHERE ID = ?',
                    arraylist, function (error, results, fields) {
                        connection.release();
                        if (error) {
                            console.error(error)
                            reject(error);
                        }
                        else {
                            resolve(results);
                        }
                    })
            })
        })
    }
});

//delete
server.route({
    method: "DELETE",
    path: '/jobs/{ID}',
    handler: (request, h) => {
        let jobID = request.params.ID;
        return new Promise(function (resolve, reject) {
            conpool.getConnection(function (err, connection) {
                if (err) {
                    reject(err)
                }
                connection.query('DELETE FROM jobs WHERE id=?', jobID, function (error, results, fields) {
                    if (error) {
                        reject(error)
                    } else {
                        resolve(results);
                    }
                })
            })
        })
    }
});

// Start the server
const start = async function () {

    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();






























