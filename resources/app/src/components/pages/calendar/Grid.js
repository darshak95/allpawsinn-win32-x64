'use babel';

import React from 'react';
import ReactDataGrid from 'react-data-grid';

let rows = [];
const rowGetter = rowNumber => rows[rowNumber];

async function updateStatusQuery(bookingObject){
    const sqlConfig = require('../../../js/sqlconfig')
    const sql = require('mssql')
    let pool = await sql.connect(sqlConfig)

    let stat = bookingObject.Status
    let bookingId = parseInt(bookingObject.BookingID)

    let queryString = "UPDATE dbo.BookingObjects SET dbo.BookingObjects.Status = '" + stat + "' WHERE dbo.BookingObjects.BookingID = " + bookingId

    let result = await pool.request()
         .query(queryString)

    sql.close()
}


async function updateBookingQuery(bookingObject) {
    const sqlConfig = require('../../../js/sqlconfig')
    const sql = require('mssql')
    let pool = await sql.connect(sqlConfig)

    let days = bookingObject.Days
    let bookingId = parseInt(bookingObject.BookingID)

    let noDays = bookingObject.NoDays

    let queryString = "UPDATE dbo.BookingObjects SET dbo.BookingObjects.NoDays = " + noDays + " WHERE dbo.BookingObjects.BookingID = " + bookingId

    let result = await pool.request()
        .query(queryString)


    queryString = "UPDATE dbo.BookingObjects SET dbo.BookingObjects.Days = '" + days + "' WHERE dbo.BookingObjects.BookingID = " + bookingId

    result = await pool.request()
        .query(queryString)


    queryString = "UPDATE dbo.BookingObjects SET dbo.BookingObjects.DayCareRate = " + bookingObject.DayCareRate + " WHERE dbo.BookingObjects.BookingID = " + bookingId

    result = await pool.request()
        .query(queryString)

    sql.close()
}

export default class Grid extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            rows,
            selectedIndexes: [],
            refresh: false,
            paid: false
        }

        this._columns = [
            { key: 'client', name: 'Client', resizable: 'true', width:100 },
            { key: 'dog', name: 'Dog', resizable: 'true', width:60 },
            { key: 'm', name: 'Monday', width:70 },
            { key: 't', name: 'Tuesday', width:70 },
            { key: 'w', name: 'Wednesday', width:80 },
            { key: 'r', name: 'Thursday', width:80 },
            { key: 'f', name: 'Friday', width:60 },
            { key: 's', name: 'Saturday', width:70 },
            { key: 'amount', name: 'Amount', width:70 },
            { key: 'pay', name: 'Pay', width: 35 },
            { key: 'status', name:"Status",width: 95},
            { key: 'print', name: 'Print',width: 60 },
            { key: 'remove', name: 'Delete', width: 60 },
            { key: 'action', name: 'Action', width: 70}
        ];

        this.createRows = this.createRows.bind(this)
        this.rowGetter = this.rowGetter.bind(this)
        this.setRows = this.setRows.bind(this)
        this.emptyRows = this.emptyRows.bind(this)
        this.onCellSelected = this.onCellSelected.bind(this)
        this.getCellActions = this.getCellActions.bind(this)
        this.getPayment = this.getPayment.bind(this)
        this.getPrint = this.getPrint.bind(this)
        this.getStatus = this.getStatus.bind(this)
        this.getNextAction = this.getNextAction.bind(this)
        this.changeState = this.changeState.bind(this)
    }

    async removeBooking(bookingObject) {
        const sqlConfig = require('../../../js/sqlconfig')
        const sql = require('mssql')
        let pool = await sql.connect(sqlConfig)

        let bookingId = parseInt(bookingObject.BookingID)

        let queryString = "DELETE FROM dbo.BookingObjects WHERE dbo.BookingObjects.BookingID = " + bookingId

        let result = await pool.request()
            .query(queryString)
            .catch((err) => {
                // console.log("Test",err)
                alert("Error")
            })
            .then(() => {
                this.deleteRows(bookingId);
                this.props.updateScreen("home");
            })
        sql.close()
       
    }

   /* async idExists(bookingId) {
        const sqlConfig = require('../../../js/sqlconfig')
        const sql = require('mssql')
        sql.close();
        let pool = await sql.connect(sqlConfig)
        let totalChargesPaid = 0;

        let queryString = "SELECT TotalChargesPaid from Payments Where BookingID =" + bookingId ;

        let result = await pool.request()
            .query(queryString)
            .catch((err) => {
                
                alert("Error")
            })
            
            if(result.recordset[0]) {

                totalChargesPaid = result.recordset[0].TotalChargesPaid;
            } else {

                totalChargesPaid = result.recordset[0];
            }
        

            sql.close()

            return totalChargesPaid;
    } */

   
    getStatus(booking){
        if(booking.Status == "NCI")
            return "Not Checked-In"
        else if(booking.Status == "CI")
            return "Checked-In"
        else if(booking.Status == "NCO")
            return "Not Checked-Out"
        else
            return "Checked-Out"
    }

   

    changeState(obj){

        // NCO - Not Checked Out
        // NCI - Not Checked In
        // CO - Checked Out
        // CI - Checked In
        let status = '';

        if(obj.Status == "NCI"){
            status = "CI"
            obj.Status = status
            updateStatusQuery(obj)
        }
        else{
            if(obj.Status == "CI") {
                status="CO"
                obj.Status = status
                 updateStatusQuery(obj)
             }
                /*this.props.payment(obj)
            }
            else if(obj.Status == "NCO")
                this.props.payment(obj)
            else
                this.props.payment(obj)*/
        }


        this.setState({
            val : 1 
        })
    }

    getNextAction(booking){
        if(booking.Status == "NCI")
            return "Check-In"
        else if(booking.Status == "CI")
            return "Check-Out"
        else if(booking.Status == "NCO")
            return "Check-Out"
        else
            return "Check-Out"
    }



    createRows(booking) {
        let day = (booking.Days)
        let rate = 0;
        rate = this.props.adminSetting.DayCareRate;
        let total = booking.NoDays * rate
        let discoRate = this.props.adminSetting.Discount
        let afterDiscount = total - discoRate;
        let taxRate = this.props.adminSetting.Tax;
        let tax = ((afterDiscount * taxRate) / 100);
        let amount = 0.00;
        if(booking.Status === 'NCI' || booking.Status === 'CI') {
        amount = 0.00;
        } else {
             if(!booking.TotalToPay) {
                amount = afterDiscount + tax;   
            } else {
                amount = booking.TotalToPay;
            }
           
        }

        rows.push({
            client: booking.FirstName + ' ' + booking.LastName,
            dog: booking.AnimalName,
            m: (day.includes("m")) ? 'X' : '',
            t: (day.includes("t")) ? 'X' : '',
            w: (day.includes("w")) ? 'X' : '',
            r: (day.includes("r")) ? 'X' : '',
            f: (day.includes("f")) ? 'X' : '',
            s: (day.includes("s")) ? 'X' : '',
            amount: amount.toFixed(2),
            status: this.getStatus(booking),
            booking: booking
        }
        );
    
    }



    rowGetter(i) {
        return this._rows[i];
    }



    getSize() {
        let count = this._rows.length; // change this line to your app logic

        if (this.state.refresh) {
            count++; // hack for update data-grid
            this.setState({
                refresh: false
            });
        }

        return count;
    }

    onCellSelected(rowIdx, idx) {
        let date = new Date(Date.now())
        let day = date.toString().substring(0, 3)
        let dayNo = 1;
        switch (day) {
            case 'Mon':
                dayNo = 1
                break;
            case 'Tue':
                dayNo = 2
                break;
            case 'Wed':
                dayNo = 3
                break;
            case 'Thu':
                dayNo = 4
                break;
            case 'Fri':
                dayNo = 5
                break;
            case 'Sat':
                dayNo = 6
                break;
            case 'Sun':
                dayNo = 7
                break;
        }
        if (rowIdx.idx >= 2 && rowIdx.idx <= 7) {
            if (this._rows[rowIdx.rowIdx].booking.Status == "CO") {
                alert("Changes can't be made as the customer has checked out");
                return;
            }

            switch (rowIdx.idx) {
                case 2:
                    if (dayNo <= 1) {
                        if (this._rows[rowIdx.rowIdx].m !== 'X') {
                            this._rows[rowIdx.rowIdx].m = 'X';
                            this._rows[rowIdx.rowIdx].booking.NoDays = this._rows[rowIdx.rowIdx].booking.NoDays + 1
                            if (this._rows[rowIdx.rowIdx].booking.NoDays <= 2) {
                            
                                this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //21.99
                            }
                            else {
                                this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //17.99
                            }
                            this._rows[rowIdx.rowIdx].booking.Days = this._rows[rowIdx.rowIdx].booking.Days + 'm'

                            let total = this._rows[rowIdx.rowIdx].booking.NoDays * this._rows[rowIdx.rowIdx].booking.DayCareRate
                            let discoRate = this.props.adminSetting.Discount;
                            let afterDiscount = total - discoRate;
                            let taxRate = this.props.adminSetting.Tax;

                            let tax = ((afterDiscount * taxRate) / 100)
                            
                            let amount = afterDiscount + tax

                            this._rows[rowIdx.rowIdx].amount = amount.toFixed(2)
                        }
                        else {
                            if(this._rows[rowIdx.rowIdx].booking.Status == "CI" && dayNo===1) {
                                alert("You can't make changes now!");
                                return;
                            }
                            if (this._rows[rowIdx.rowIdx].booking.NoDays !== 1) {
                                this._rows[rowIdx.rowIdx].m = ''
                                this._rows[rowIdx.rowIdx].booking.NoDays = this._rows[rowIdx.rowIdx].booking.NoDays - 1
                                if (this._rows[rowIdx.rowIdx].booking.NoDays <= 2) {
                                    this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //21.99
                                }
                                else {
                                    this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //17.99
                                }
                                this._rows[rowIdx.rowIdx].booking.Days = this._rows[rowIdx.rowIdx].booking.Days.replace('m', '');

                                 let total = this._rows[rowIdx.rowIdx].booking.NoDays * this._rows[rowIdx.rowIdx].booking.DayCareRate
                                 let discoRate = this.props.adminSetting.Discount;
                                 let afterDiscount = total - discoRate;
                                 let taxRate = this.props.adminSetting.Tax;

                                let tax = ((afterDiscount * taxRate) / 100)
                            
                                let amount = afterDiscount + tax
                                this._rows[rowIdx.rowIdx].amount = amount.toFixed(2)
                            }
                        }
                    }
                    break;
                case 3:
                    if (dayNo <= 2) {
                        if (this._rows[rowIdx.rowIdx].t !== 'X') {
                            this._rows[rowIdx.rowIdx].t = 'X'
                            this._rows[rowIdx.rowIdx].booking.NoDays = this._rows[rowIdx.rowIdx].booking.NoDays + 1
                            if (this._rows[rowIdx.rowIdx].booking.NoDays <= 2) {
                                this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //21.99
                            }
                            else {
                                this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //17.99
                            }
                            this._rows[rowIdx.rowIdx].booking.Days = this._rows[rowIdx.rowIdx].booking.Days + 't'
                                 let total = this._rows[rowIdx.rowIdx].booking.NoDays * this._rows[rowIdx.rowIdx].booking.DayCareRate
                                 let discoRate = this.props.adminSetting.Discount;
                                 let afterDiscount = total - discoRate;
                                 let taxRate = this.props.adminSetting.Tax;

                                let tax = ((afterDiscount * taxRate) / 100)
                            
                                let amount = afterDiscount + tax
                            this._rows[rowIdx.rowIdx].amount = amount.toFixed(2)
                        }
                        else {
                            if(this._rows[rowIdx.rowIdx].booking.Status == "CI" && dayNo===2) {
                                alert("You can't make changes now!");
                                return;
                            }
                            if (this._rows[rowIdx.rowIdx].booking.NoDays !== 1) {
                                this._rows[rowIdx.rowIdx].t = ''
                                this._rows[rowIdx.rowIdx].booking.NoDays = this._rows[rowIdx.rowIdx].booking.NoDays - 1
                                if (this._rows[rowIdx.rowIdx].booking.NoDays <= 2) {
                                    this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; // 21.99
                                }
                                else {
                                    this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //17.99
                                }
                                this._rows[rowIdx.rowIdx].booking.Days = this._rows[rowIdx.rowIdx].booking.Days.replace('t', '');
                                 let total = this._rows[rowIdx.rowIdx].booking.NoDays * this._rows[rowIdx.rowIdx].booking.DayCareRate
                                 let discoRate = this.props.adminSetting.Discount;
                                 let afterDiscount = total - discoRate;
                                 let taxRate = this.props.adminSetting.Tax;

                                let tax = ((afterDiscount * taxRate) / 100)
                            
                                let amount = afterDiscount + tax
                                this._rows[rowIdx.rowIdx].amount = amount.toFixed(2)
                            }
                        }
                    }
                    break;
                case 4:
                    if (dayNo <= 3) {
                        if (this._rows[rowIdx.rowIdx].w !== 'X') {
                            this._rows[rowIdx.rowIdx].w = 'X'
                            this._rows[rowIdx.rowIdx].booking.NoDays = this._rows[rowIdx.rowIdx].booking.NoDays + 1
                            if (this._rows[rowIdx.rowIdx].booking.NoDays <= 2) {
                                this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //21.99
                            }
                            else {
                                this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //17.99
                            }
                            this._rows[rowIdx.rowIdx].booking.Days = this._rows[rowIdx.rowIdx].booking.Days + 'w'
                             let total = this._rows[rowIdx.rowIdx].booking.NoDays * this._rows[rowIdx.rowIdx].booking.DayCareRate
                                 let discoRate = this.props.adminSetting.Discount;
                                 let afterDiscount = total - discoRate;
                                 let taxRate = this.props.adminSetting.Tax;

                                let tax = ((afterDiscount * taxRate) / 100)
                            
                                let amount = afterDiscount + tax
                            this._rows[rowIdx.rowIdx].amount = amount.toFixed(2)
                        }
                        else {
                            if(this._rows[rowIdx.rowIdx].booking.Status == "CI" && dayNo===3) {
                                alert("You can't make changes now!");
                                return;
                            }
                            if (this._rows[rowIdx.rowIdx].booking.NoDays !== 1) {
                                this._rows[rowIdx.rowIdx].w = ''
                                this._rows[rowIdx.rowIdx].booking.NoDays = this._rows[rowIdx.rowIdx].booking.NoDays - 1
                                if (this._rows[rowIdx.rowIdx].booking.NoDays <= 2) {
                                    this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //21.99
                                }
                                else {
                                    this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //17.99
                                }
                                this._rows[rowIdx.rowIdx].booking.Days = this._rows[rowIdx.rowIdx].booking.Days.replace('w', '');

                                 let total = this._rows[rowIdx.rowIdx].booking.NoDays * this._rows[rowIdx.rowIdx].booking.DayCareRate
                                 let discoRate = this.props.adminSetting.Discount;
                                 let afterDiscount = total - discoRate;
                                 let taxRate = this.props.adminSetting.Tax;

                                let tax = ((afterDiscount * taxRate) / 100)
                            
                                let amount = afterDiscount + tax
                                this._rows[rowIdx.rowIdx].amount = amount.toFixed(2)
                            }
                        }
                    }
                    break;
                case 5:
                    if (dayNo <= 4) {
                        if (this._rows[rowIdx.rowIdx].r !== 'X') {
                            this._rows[rowIdx.rowIdx].r = 'X'
                            this._rows[rowIdx.rowIdx].booking.NoDays = this._rows[rowIdx.rowIdx].booking.NoDays + 1
                            if (this._rows[rowIdx.rowIdx].booking.NoDays <= 2) {
                                this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //21.99
                            }
                            else {
                                this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //17.99
                            }
                            this._rows[rowIdx.rowIdx].booking.Days = this._rows[rowIdx.rowIdx].booking.Days + 'r'
                             let total = this._rows[rowIdx.rowIdx].booking.NoDays * this._rows[rowIdx.rowIdx].booking.DayCareRate
                                 let discoRate = this.props.adminSetting.Discount;
                                 let afterDiscount = total - discoRate;
                                 let taxRate = this.props.adminSetting.Tax;

                                let tax = ((afterDiscount * taxRate) / 100)
                            
                                let amount = afterDiscount + tax
                            this._rows[rowIdx.rowIdx].amount = amount.toFixed(2)
                        }
                        else {
                            if(this._rows[rowIdx.rowIdx].booking.Status == "CI" && dayNo===4) {
                                alert("You can't make changes now!");
                                return;
                            }
                            if (this._rows[rowIdx.rowIdx].booking.NoDays !== 1) {
                                this._rows[rowIdx.rowIdx].r = ''
                                this._rows[rowIdx.rowIdx].booking.NoDays = this._rows[rowIdx.rowIdx].booking.NoDays - 1
                                if (this._rows[rowIdx.rowIdx].booking.NoDays <= 2) {
                                    this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //21.99
                                }
                                else {
                                    this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //17.99
                                }
                                this._rows[rowIdx.rowIdx].booking.Days = this._rows[rowIdx.rowIdx].booking.Days.replace('r', '');

                                let total = this._rows[rowIdx.rowIdx].booking.NoDays * this._rows[rowIdx.rowIdx].booking.DayCareRate
                                 let discoRate = this.props.adminSetting.Discount;
                                 let afterDiscount = total - discoRate;
                                 let taxRate = this.props.adminSetting.Tax;

                                let tax = ((afterDiscount * taxRate) / 100);
                            
                                let amount = afterDiscount + tax;
                                this._rows[rowIdx.rowIdx].amount = amount.toFixed(2)
                            }
                        }
                    }
                    break;
                case 6:
                    if (dayNo <= 5) {
                        if (this._rows[rowIdx.rowIdx].f !== 'X') {
                            this._rows[rowIdx.rowIdx].f = 'X'
                            this._rows[rowIdx.rowIdx].booking.NoDays = this._rows[rowIdx.rowIdx].booking.NoDays + 1
                            if (this._rows[rowIdx.rowIdx].booking.NoDays <= 2) {
                                this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //21.99
                            }
                            else {
                                this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //17.99
                            }
                            this._rows[rowIdx.rowIdx].booking.Days = this._rows[rowIdx.rowIdx].booking.Days + 'f'
                             let total = this._rows[rowIdx.rowIdx].booking.NoDays * this._rows[rowIdx.rowIdx].booking.DayCareRate
                                 let discoRate = this.props.adminSetting.Discount;
                                 let afterDiscount = total - discoRate;
                                 let taxRate = this.props.adminSetting.Tax;

                                let tax = ((afterDiscount * taxRate) / 100)
                            
                                let amount = afterDiscount + tax
                            this._rows[rowIdx.rowIdx].amount = amount.toFixed(2)
                        }
                        else {
                            if(this._rows[rowIdx.rowIdx].booking.Status == "CI" && dayNo===5) {
                                alert("You can't make changes now!");
                                return;
                            }
                            if (this._rows[rowIdx.rowIdx].booking.NoDays !== 1) {
                                this._rows[rowIdx.rowIdx].f = ''
                                this._rows[rowIdx.rowIdx].booking.NoDays = this._rows[rowIdx.rowIdx].booking.NoDays - 1
                                if (this._rows[rowIdx.rowIdx].booking.NoDays <= 2) {
                                    this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //21.99
                                }
                                else {
                                    this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; //17.99
                                }
                                this._rows[rowIdx.rowIdx].booking.Days = this._rows[rowIdx.rowIdx].booking.Days.replace('f', '');

                                let total = this._rows[rowIdx.rowIdx].booking.NoDays * this._rows[rowIdx.rowIdx].booking.DayCareRate
                                 let discoRate = this.props.adminSetting.Discount;
                                 let afterDiscount = total - discoRate;
                                 let taxRate = this.props.adminSetting.Tax;

                                let tax = ((afterDiscount * taxRate) / 100)
                            
                                let amount = afterDiscount + tax
                                this._rows[rowIdx.rowIdx].amount = amount.toFixed(2)
                            }
                        }
                    }
                    break;
                case 7:
                    if (dayNo <= 6) {
                        if (this._rows[rowIdx.rowIdx].s !== 'X') {
                            this._rows[rowIdx.rowIdx].s = 'X'
                            this._rows[rowIdx.rowIdx].booking.NoDays = this._rows[rowIdx.rowIdx].booking.NoDays + 1
                            if (this._rows[rowIdx.rowIdx].booking.NoDays <= 2) {
                            }
                            else {
                                this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; 
                            }
                            this._rows[rowIdx.rowIdx].booking.Days = this._rows[rowIdx.rowIdx].booking.Days + 's'
                             let total = this._rows[rowIdx.rowIdx].booking.NoDays * this._rows[rowIdx.rowIdx].booking.DayCareRate
                                 let discoRate = this.props.adminSetting.Discount;
                                 let afterDiscount = total - discoRate;
                                 let taxRate = this.props.adminSetting.Tax;

                                let tax = ((afterDiscount * taxRate) / 100)
                            
                                let amount = afterDiscount + tax
                            this._rows[rowIdx.rowIdx].amount = amount.toFixed(2)
                        }
                        else {
                            if(this._rows[rowIdx.rowIdx].booking.Status == "CI" && dayNo === 6) {
                                alert("You can't make changes now!");
                                return;
                            }
                            if (this._rows[rowIdx.rowIdx].booking.NoDays !== 1) {
                                this._rows[rowIdx.rowIdx].s = ''
                                this._rows[rowIdx.rowIdx].booking.NoDays = this._rows[rowIdx.rowIdx].booking.NoDays - 1
                                if (this._rows[rowIdx.rowIdx].booking.NoDays <= 2) {
                                    this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; 
                                }
                                else {
                                    this._rows[rowIdx.rowIdx].booking.DayCareRate = this.props.adminSetting.DayCareRate; 
                                }
                                this._rows[rowIdx.rowIdx].booking.Days = this._rows[rowIdx.rowIdx].booking.Days.replace('s', '');

                                 let total = this._rows[rowIdx.rowIdx].booking.NoDays * this._rows[rowIdx.rowIdx].booking.DayCareRate
                                 let discoRate = this.props.adminSetting.Discount;
                                 let afterDiscount = total - discoRate;
                                 let taxRate = this.props.adminSetting.Tax;

                                let tax = ((afterDiscount * taxRate) / 100)
                            
                                let amount = afterDiscount + tax
                                this._rows[rowIdx.rowIdx].amount = amount.toFixed(2)
                            }
                        }
                    }
                    break;
            }
            this.setRows();
            updateBookingQuery(this._rows[rowIdx.rowIdx].booking);
            this.Refresh();
        }
    };

    setRows() {
        this._rows = rows;
    };

    Refresh() {
        this.setState({
            refresh: false
        });
    }
    emptyRows() {
        rows = []
        this._rows = []
    }

     

    getCellActions(column, row) {
        
        if (column.key === 'pay' && row.booking.Status == "CO") {
            if(row.booking.BookingCharge  > 0 || row.booking.BookingCharge === null) {
            
              return [
                {
                    icon: 'glyphicon glyphicon-usd',
                    callback: () => { this.getPayment(row.booking)}
                }
            ];
          
          } else if(row.booking.BookingCharge === 0) {
              
               return [
                {
                    icon: 'glyphicon glyphicon-ok',
                    callback: () => { this.getPayment(row.booking)}
                }
            ];   

          }

         }  
        if (column.key === 'print') {
            return [
                {
                    icon: 'glyphicon glyphicon-print',
                    callback: () => { this.getPrint(row.booking) }
                }
            ];
        }
        if (column.key === 'remove' && row.booking.Status != "CO") {
            return [
                {
                    icon: 'glyphicon glyphicon-trash',
                    callback: () => { this.removeBooking(row.booking) }
                }
            ];
        }

        if (column.key === 'action' && row.booking.Status != "CO") {
            if(row.booking.Status === "NCI") {
                return [
                {
                    icon: 'glyphicon glyphicon-minus',
                    callback: () => { this.changeState(row.booking) }
                }
            ];
            }
            else {
                return [
                {
                    icon: 'glyphicon glyphicon-plus',
                    callback: () => { this.changeState(row.booking) }
                }
            ];
            }
        }

    
    }

    
    getPayment(obj) {
        this.props.payment(obj)
        this.setState({pay : 'Paid'})
        //updateStatusQuery(obj)
    }

    getPrint(obj) {
        this.props.print(obj)
    }

    getList(curList) {
         
        return curList.map(obj =>
            <div key={obj.BookingID}>
                {this.createRows(obj)}
            </div>
        )
    }

    deleteRows(bookingId) {
        let rows = this._rows.map(el => el.booking).slice()
        this._rows = rows.filter(row => row.BookingID !== bookingId)
    }

    render() {
        this.emptyRows()
        const rowText = this.state.selectedIndexes.length === 1 ? 'row' : 'rows';
        let curList = this.props.current;
        // TODO: Add first-to-last & last-to-first switch
        return (
            <div>
                {this.getList(curList)}
                {this.setRows()}
                <div id="dataGrid" style={{ marginTop: '20px' }} style={{cursor:'pointer'}}>
                    <ReactDataGrid
                        rowsCount={this.getSize()}
                        ref={node => this.grid = node}
                        columns={this._columns}
                        rowGetter={this.rowGetter}
                        //	rowsCount={this._rows.length}
                        minHeight={800}
                        enableCellSelect={true}
                        onCellSelected={this.onCellSelected}
                        getCellActions={this.getCellActions}
                    />
                   
                </div>
            </div>
        )
    }

}

const coStyle = {
    color : "green",
    paddingRight : 10,
    float : "left"
}

const notStyle = {
    color : "red",
    paddingRight : 10,
    float : "left"
}

const ciStyle = {
    color : "#CCCC00",
    paddingRight : 10,
    float : "left"
}
