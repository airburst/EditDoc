import install from 'jasmine-es6';
install();
import matchers from 'jasmine-immutable-matchers';
import Immutable from 'immutable';

describe('immutability', () => {

    describe('A List', () => {

        beforeEach(function () {
            jasmine.addMatchers(matchers);
        })

        function addMovie(currentState, movie) {
            return currentState.push(movie);
        }

        it('passes if the object is immutable', function () {
            expect(Immutable.Map()).toBeImmutable();
        });

        it('passes if the immutable objects are equal', function () {
            expect(Immutable.Map({a: 1})).toEqualImmutable(Immutable.Map({a: 1}));
        });

        it('is immutable', () => {
            let state = Immutable.List.of('Trainspotting', '28 Days Later');
            let nextState = addMovie(state, 'Sunshine');

            expect(state).toEqual(Immutable.List.of(
                'Trainspotting',
                '28 Days Later'
            ));

            expect(nextState).toEqualImmutable(Immutable.List.of(
                'Trainspotting',
                '28 Days Later',
                'Sunshine'
            ));
        });

    });

});