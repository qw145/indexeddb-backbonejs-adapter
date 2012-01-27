/**
 * Created by JetBrains PhpStorm.
 * User: calvy
 * Date: 12/01/12
 * Time: 11:52
 * To change this template use File | Settings | File Templates.
 */

window.console = jstestdriver.console;

var databasev1 = {
    id:"movies-database",
    description:"The database for the Movies",
    migrations:[
        {
            version:1,
            migrate:function (transaction, next) {
                var store = transaction.db.createObjectStore("movies");
                next();
            }
        }
    ]
};

var databasev2 = {
    id:"movies-database",
    description:"The database for the Movies",
    migrations:[
        {
            version:1,
            migrate:function (transaction, next) {
                var store = transaction.db.createObjectStore("movies");
                next();
            }
        },
        {
            version:2,
            migrate:function (transaction, next) {
                var store = undefined;
                if (!transaction.db.objectStoreNames.contains("movies")) {
                    store = transaction.db.createObjectStore("movies");
                }
                store = transaction.objectStore("movies");
                store.createIndex("titleIndex", "title", {
                    unique:false
                });
                store.createIndex("formatIndex", "format", {
                    unique:false
                });
                next();
            }
        }
    ]
};

var MovieV1 = Backbone.Model.extend({
    database:databasev1,
    storeName:"movies"
});

var Movie = Backbone.Model.extend({
    database:databasev2,
    storeName:"movies"
});

var Theater = Backbone.Collection.extend({
    database:databasev2,
    storeName:"movies",
    model:Movie
});

var fallBackDBGuid = guid();

deleteDB(databasev1);
deleteDB(databasev2);


function deleteDB(dbObj) {
    try {

        var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;

        var dbreq = indexedDB.deleteDatabase(dbObj.id);
        dbreq.onsuccess = function (event) {
            var db = event.result;
            jstestdriver.console.log("indexedDB: " + dbObj.id + " deleted");
        }
        dbreq.onerror = function (event) {
            jstestdriver.console.error("indexedDB.delete Error: " + event.message);
        }
    }
    catch (e) {
        jstestdriver.console.error("Error: " + e.message);
        //prefer change id of database to start ont new instance
        dbObj.id = dbObj.id + "." + fallBackDBGuid;
        jstestdriver.console.log("fallback to new database name :" + dbObj.id)
    }
}

// Generate four random hex digits.
function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

var backboneIndexedDBTest = AsyncTestCase('backboneIndexedDBTest');

backboneIndexedDBTest.prototype.testCreateModelV1 = function (queue) {

    queue.call("Try create model v1", function (callbacks) {

        var onSuccess = callbacks.add(function () {
            jstestdriver.console.log("create model v1 Success");
            assertTrue("database & model created", true);
        });

        var onError = callbacks.addErrback(function () {
            jstestdriver.console.log("create model v1 Error");
        });


        var movie = new MovieV1();
        movie.save({
                title:"The Matrix",
                format:"dvd"
            },
            {
                success:onSuccess,
                error:onError});
    });
};


backboneIndexedDBTest.prototype.testCreateModelV2 = function (queue) {
    queue.call("Try create model v2", function (callbacks) {

            var onSuccess = callbacks.add(function () {
                jstestdriver.console.log("create model v2 Success");
                assertTrue("database & model created", true);
            });

            var onError = callbacks.addErrback(function () {
                jstestdriver.console.log("create model v2 Error");
            });


            var movie = new Movie();
            movie.save({
                    title:"The Matrix 2",
                    format:"dvd"
                },
                {
                    success:onSuccess,
                    error:onError});
        }
    );
};

backboneIndexedDBTest.prototype.testReadModel = function (queue) {
    var movie = undefined;
    var savedMovie = undefined;
    queue.call("Try create model", function (callbacks) {

            var onSuccess = callbacks.add(function () {
                assertTrue("model created", true);
            });

            var onError = callbacks.addErrback(function () {
                jstestdriver.console.log("model v2 Error");
            });


            movie = new Movie();
            movie.save({
                    title:"The Matrix 3",
                    format:"dvd"
                },
                {
                    success:onSuccess,
                    error:onError});
        }
    );

    queue.call("Try read model with id", function (callbacks) {

            var onSuccess = callbacks.add(function (object) {
                assertEquals("The movie should have the right title vs savedMovie", savedMovie.toJSON().title, movie.toJSON().title);
                assertEquals("The movie should have the right format vs savedMovie", savedMovie.toJSON().format, movie.toJSON().format);
                assertEquals("The movie should have the right title vs object", object.toJSON().title, movie.toJSON().title);
                assertEquals("The movie should have the right format vs object", object.toJSON().format, movie.toJSON().format);
            });

            var onError = callbacks.addErrback(function () {
                jstestdriver.console.log("create model v2 Error");
            });

            console.log("************" + movie.id);
            savedMovie = new Movie({id:movie.id});
            savedMovie.fetch({
                success:onSuccess,
                error:onError});
        }
    );

    queue.call("Try read model with index", function (callbacks) {

            var onSuccess = callbacks.add(function (object) {
                assertEquals("The movie should have the right title vs savedMovie", savedMovie.toJSON().title, movie.toJSON().title);
                assertEquals("The movie should have the right format vs savedMovie", savedMovie.toJSON().format, movie.toJSON().format);
                assertEquals("The movie should have the right title vs object", object.toJSON().title, movie.toJSON().title);
                assertEquals("The movie should have the right format vs object", object.toJSON().format, movie.toJSON().format);
            });

            var onError = callbacks.addErrback(function () {
                jstestdriver.console.log("can't find mode with title");
            });

            jstestdriver.console.log("************" + movie.toJSON().title);
            savedMovie = new Movie({title:movie.toJSON().title});
            savedMovie.fetch({
                success:onSuccess,
                error:onError});
        }
    );

    queue.call("Try read model that do not exist with index", function (callbacks) {

            var onError = callbacks.add(function (object) {
                assertTrue(true);
            });

            var onSuccess = callbacks.addErrback(function () {
                jstestdriver.console.log("film exist it's an error");
            });

            var nonExistMovie = new Movie({title:"Invalid film"});
            nonExistMovie.fetch({
                success:onSuccess,
                error:onError});
        }
    );
};


backboneIndexedDBTest.prototype.testUpdateModel = function (queue) {
    var movie = undefined;
    queue.call("Try create model", function (callbacks) {

            var onSuccess = callbacks.add(function () {
                assertTrue("model created", true);
            });

            var onError = callbacks.addErrback(function () {
                jstestdriver.console.log("model v2 Error");
            });


            movie = new Movie();
            movie.save({
                    title:"Star vars V",
                    format:"dvd"
                },
                {
                    success:onSuccess,
                    error:onError});
        }
    );

    queue.call("Try update model", function (callbacks) {

            var onSuccess = callbacks.add(function () {
                assertEquals("The movie should have the right title", movie.toJSON().title, "Star Wars V");
            });

            var onError = callbacks.addErrback(function () {
                jstestdriver.console.log("create model v2 Error");
            });

            movie.save({
                title:"Star Wars V"}, {
                success:onSuccess,
                error:onError});
        }
    );

};


backboneIndexedDBTest.prototype.testDeleteModel = function (queue) {
    var movie = undefined;
    queue.call("Try create model", function (callbacks) {

            var onSuccess = callbacks.add(function () {
                assertTrue("model created", true);
            });

            var onError = callbacks.addErrback(function () {
                jstestdriver.console.log("model v2 Error");
            });


            movie = new Movie();
            movie.save({
                    title:"Star vars V",
                    format:"dvd"
                },
                {
                    success:onSuccess,
                    error:onError});
        }
    );

    queue.call("Try delete model", function (callbacks) {

            var onSuccess = callbacks.add(function () {
                assertTrue(true);
            });

            var onError = callbacks.addErrback(function () {
                jstestdriver.console.log("create model v2 Error");
            });

            movie.destroy({
                success:onSuccess,
                error:onError});
        }
    );

    queue.call("Try get deleted model", function (callbacks) {

            var onError = callbacks.add(function () {
                assertTrue("can't find deleted model", true);
            });

            var onSuccess = callbacks.addErrback(function () {
                jstestdriver.console.log("deleted object model fetched successfully?");
            });

            movie.fetch({
                success:onSuccess,
                error:onError});
        }
    );
};

function resetMovies(collection) {


    _.each(collection.models, function (movie) {
        movie.destroy();
    })

    collection.reset();

    var movies = [
        {
            title:"Hello",
            format:"blueray",
            id:"1"
        },
        {
            title:"Bonjour",
            format:"dvd",
            id:"2"
        },
        {
            title:"Halo",
            format:"blueray",
            id:"3"
        },
        {
            title:"Nihao",
            format:"streaming",
            id:"4"
        },
        {
            title:"Ciao",
            format:"dvd",
            id:"5"
        }
    ];

    _.each(movies, function (movie) {
        var m = new Movie();
        m.save(movie);
    });

    collection.reset(movies);

}
;


backboneIndexedDBTest.prototype.testReadCollection = function (queue) {
    var theater = undefined;
    queue.call("Try clean collection", function (callbacks) {

            var onSuccess = callbacks.add(function (model) {
                resetMovies(theater);
                assertEquals("collection created", model.models.length, 5);
            });

            var onError = callbacks.addErrback(function () {
                jstestdriver.console.log("fetc collection Error");
            });

            theater = new Theater();
            var model = theater.fetch(
                {
                    "success":onSuccess,
                    "error":onError
                }
            );

        }
    );

    queue.call("Try read collection with no options", function (callbacks) {

            var onSuccess = callbacks.add(function () {
                assertEquals("Should have 5 elements", 5, theater.models.length);
                assertEquals("Should have [\"Hello\", \"Bonjour\", \"Halo\", \"Nihao\", \"Ciao\"]", ["Hello", "Bonjour", "Halo", "Nihao", "Ciao"], theater.pluck("title"));
            });

            var onError = callbacks.addErrback(function () {
                jstestdriver.console.log("create model v2 Error");
            });

            theater.fetch({
                success:onSuccess,
                error:onError});
        }
    );

    queue.call("Try read collection with limit", function (callbacks) {

                var onSuccess = callbacks.add(function () {
                    assertEquals("Should have 3 elements",3, theater.models.length);
                    assertEquals("Should have [\"Hello\", \"Bonjour\", \"Halo\"]", ["Hello", "Bonjour", "Halo"], theater.pluck("title"));
                });

                var onError = callbacks.addErrback(function () {
                    jstestdriver.console.log("create model v2 Error");
                });

                theater.fetch({
                    limit : 3,
                    success:onSuccess,
                    error:onError});
            }
        );

    queue.call("Try read collection with offset", function (callbacks) {

                var onSuccess = callbacks.add(function () {
                    assertEquals("Should have 3 elements",3, theater.models.length);
                    assertEquals("Should have [\"Halo\", \"Nihao\", \"Ciao\"]", ["Halo", "Nihao", "Ciao"], theater.pluck("title"));
                });

                var onError = callbacks.addErrback(function () {
                    jstestdriver.console.log("create model v2 Error");
                });

                theater.fetch({
                    offset : 2,
                    success:onSuccess,
                    error:onError});
            }
        );

    queue.call("Try read collection with offset and limit", function (callbacks) {

                    var onSuccess = callbacks.add(function () {
                        assertEquals("Should have 3 elements",3, theater.models.length);
                        assertEquals("Should have [\"Halo\", \"Nihao\", \"Ciao\"]", ["Halo", "Nihao", "Ciao"], theater.pluck("title"));
                    });

                    var onError = callbacks.addErrback(function () {
                        jstestdriver.console.log("create model v2 Error");
                    });

                    theater.fetch({
                        offset : 2,
                        success:onSuccess,
                        error:onError});
                }
            );

};