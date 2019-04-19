const graphql = require('graphql');
import { withFilter, PubSub } from 'graphql-subscriptions';
const pubsub = new PubSub();

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLID,
    GraphQLSchema,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull } = graphql;

const Book = require('../models/book');
const Author = require('../models/author');

const BOOKS_FETCHED_TOPIC = 'books_fetched';

// this is a function that takes in object type
const BookType = new GraphQLObjectType({
    name: 'Book',
    fields: () => ({   // we put every detail in function, which needs to be explicitly called, else we get errors on the types
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        genre: { type: GraphQLString },
        author: {
            type: AuthorType,
            resolve(parent, args) {
                return Author.findById(parent.authorID);
            }
        }
    })
});

const AuthorType = new GraphQLObjectType({
    name: 'Author',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        age: { type: GraphQLInt },
        books: {
            type: new GraphQLList(BookType),
            resolve(parent, args) {
                return Book.find({ authorID: parent.id })
            }
        }
    })
});

// user uses exact names as written below when he wants to query
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        book: {
            type: BookType,
            args: { id: { type: GraphQLID } },      //book(id:"123") {name }
            resolve(parent, args) {
                //code to get data from db
                return Book.findById(args.id);
            }
        },
        books: {
            type: new GraphQLList(BookType),
            resolve(parent, args) {
                let books = Book.find({});
                pubsub.publish(BOOKS_FETCHED_TOPIC, { booksFetched: books });
                return Book.find({});
            }
        },
        author: {
            type: AuthorType,
            args: { id: { type: GraphQLID } },
            resolve(parent, args) {
                return Author.findById(args.id);
            }
        },
        authors: {
            type: new GraphQLList(AuthorType),
            resolve(parent, args) {
                return Author.find({});
            }
        }
    }
});

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addAuthor: {
            type: AuthorType,
            args: {
                name: { type: new GraphQLNonNull(GraphQLString) },
                age: { type: GraphQLInt }
            },
            resolve(parent, args) {
                let author = new Author({
                    name: args.name,
                    age: args.age
                });  // local instance of author model
                return author.save();
            }
        },
        addBook: {
            type: BookType,
            args: {
                name: { type: new GraphQLNonNull(GraphQLString) },
                genre: { type: GraphQLString },
                authorID: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve(parent, args) {
                let book = new Book({
                    name: args.name,
                    genre: args.genre,
                    authorID: args.authorID
                });  // local instance of book model
                return book.save();
            }
        }
    }
});

const Subscription = new GraphQLObjectType({
    name: 'Subscription',
    fields: () => ({
        booksFetched: {
            type: new GraphQLList(BookType),
            // resolve: (payload, args, context, info) => {
            //     // Manipulate and return the new value
            //     return payload;
            // },
            subscribe: () => pubsub.asyncIterator(BOOKS_FETCHED_TOPIC),
            // subscribe: withFilter(
            //     () => pubsub.asyncIterator(SOMETHING_CHANGED_TOPIC),
            //     (payload, variables) => {
            //         console.log('payload',payload.somethingChanged);
            //         return payload.somethingChanged.authorID === '5cb72ee5ba1e171239233822';
            //     }
            // )
        },
    })
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation,
    subscription: Subscription
});