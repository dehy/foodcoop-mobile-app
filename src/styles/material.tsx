import React, { StyleSheet } from 'react-native';
export default StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: 'white',
        flex: 1,
        height: 56,
        marginVertical: 8,
        paddingVertical: 0,
        paddingHorizontal: 16
    },
    rowIcon: {
        flex: 0,
        marginRight: 16,
        fontSize: 36,
        color: 'rgba(0, 0, 0, 0.380392)'
    },
    rowIconDate: {
        flex: 0,
        flexDirection: 'column',
        marginRight: 16,
        color: 'rgba(0, 0, 0, 0.380392)',
    },
    rowIconDateDay: {
        flex: 0,
        fontSize: 24,
    },
    rowIconDateMonth: {
        flex: 0,
        textAlign: 'center'
    },
    rowContent: {
        flexDirection: 'column',
        flex: 1
    },
    rowTitle: {
        fontSize: 16,
        color: 'rgba(0, 0, 0, 0.870588)'
    },
    rowSubtitle: {
        fontSize: 14,
        color: 'rgba(0, 0, 0, 0.541176)'
    },
    rowActionIcon: {
        flex: 0,
        color: 'rgba(0, 0, 0, 0.380392)',
        fontSize: 24
    },
    rowDetailText: {
        textAlign: 'right'
    }
});
