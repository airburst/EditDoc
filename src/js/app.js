import React from 'react';
import DocContainer from './components/doc-container';
import Data from './data/doc-data';

main();

function main() {
    React.render(<DocContainer data={Data} />, document.body);
}
