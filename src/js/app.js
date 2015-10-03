import React from 'react';
import DocContainer from './components/doc-container';
import Data from './data/doc-data';
import AppSettings from './data/app-settings';

main();

function main() {
    React.render(<DocContainer data={Data} settings={AppSettings}/>, document.body);
}
