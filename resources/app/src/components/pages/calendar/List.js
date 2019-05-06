// ---------------------------------------- TO DO ----------------------------------------

'use babel';

import React from 'react';

let todayDate = (new Date(Date.now())).toString().substring(0,15);

function parseDate(date){
	return date.toString().split('GMT')[0]
}

export default class List extends React.Component {
	constructor(props){
		super(props)
		this.getStatus = this.getStatus.bind(this)
		this.getNextAction = this.getNextAction.bind(this)
		this.changeState = this.changeState.bind(this)
		this.toDatetime = this.toDatetime.bind(this)
        this.sqlParse = this.sqlParse.bind(this)
        this.updateStatusQuery = this.updateStatusQuery.bind(this)
        this.getDayIndex = this.getDayIndex.bind(this)
	}


	async updateStatusQuery(bookingObject){
	 let stat = bookingObject.Status
        const sqlConfig = require('../../../js/sqlconfig');
        const sql = require('mssql');
        let pool = await sql.connect(sqlConfig);

       
        let bookingId = parseInt(bookingObject.BookingID)
        let accbal = 0.00;
        let day = (bookingObject.Days)
        let rate = 0;
        rate = this.props.adminSetting.DayCareRate;
        let total = bookingObject.NoDays * rate
        let discoRate = this.props.adminSetting.Discount
        let afterDiscount = total - discoRate;
        let taxRate = this.props.adminSetting.Tax;
        let tax = ((afterDiscount * taxRate) / 100);
        let amount = 0.00;
        if(bookingObject.Status === 'CI') {
        amount = 0.00;
        } else {
             if(!bookingObject.TotalToPay) {
                amount = afterDiscount + tax;   
            } else {
                amount = bookingObject.TotalToPay;
            }
           
        }
        let date = this.toDatetime(new Date(Date.now()));
        if(stat === "CI") {

        let queryString = `UPDATE dbo.BookingObjects SET dbo.BookingObjects.Status = '${stat}' ,dbo.BookingObjects.TodayDate ='${todayDate}',dbo.BookingObjects.DateIn='${date}'  WHERE dbo.BookingObjects.BookingID = ${bookingId}`
        let result = await pool.request()
             .query(queryString);
          } else if(stat === "CO") {
              console.log("CO");
              let queryString2 = `UPDATE dbo.BookingObjects SET dbo.BookingObjects.Status = '${stat}',dbo.BookingObjects.DateOut='${date}' WHERE dbo.BookingObjects.BookingID = ${bookingId}`
              console.log(queryString2);
              let result2 = await pool.request()
                   .query(queryString2);

               
               let queryString9 = `Select * From dbo.ClientDetails Where dbo.ClientDetails.ClientID = ${bookingObject.ClientID[0]}`;
                console.log(queryString9);
               let result9 = await pool.request()
                   .query(queryString9);  
                

              let queryString8 = `INSERT INTO Payments (BookingID,OtherChargesPaid,TaxPaid,TotalChargesPaid,ExtraServices,DayCareRate,SubTotal,Discount,NetBookingCharges,FirstName,LastName) Values (${bookingId},0,0,0,0,0,0,0,0,'${result9.recordset[0].FirstName}','${result9.recordset[0].LastName}')`;
               console.log(queryString8);
              let result8 = await pool.request()
                   .query(queryString8);     

              let queryString3 = `SELECT dbo.ClientDetails.AccountBalance FROM dbo.ClientDetails WHERE dbo.ClientDetails.ClientID=${bookingObject.ClientID[0]}`;
              
              let result3 = await pool.request()
                   .query(queryString3);

              if(!result3.recordset[0].AccountBalance) {
                let queryString4 =  `Update dbo.ClientDetails SET dbo.ClientDetails.AccountBalance = ${amount} WHERE dbo.ClientDetails.ClientID = ${bookingObject.ClientID[0]}`;
                let result4 = await pool.request()
                   .query(queryString4);
                let queryString7 =  `Select dbo.ClientDetails.AccountBalance FROM dbo.ClientDetails`;
                
                let result7 = await pool.request()
                   .query(queryString7);
                
              } else {
                accbal = bookingObject.TotalToPay + result3.recordset[0].AccountBalance;
                let queryString5 =  `Update dbo.ClientDetails SET dbo.ClientDetails.AccountBalance = ${amount + accbal} WHERE dbo.ClientDetails.ClientID = ${bookingObject.ClientID[0]}`;
                let result4 = await pool.request()
                   .query(queryString5);                

              }

                  
          }


        sql.close();
        this.props.updateScreen("home");
}

getDayIndex(day) {
        switch (day) {
            case 'Mon':
                return 'm';
                break;
            case 'Tue':
                return 't';
                break;
            case 'Wed':
                return 'w';
                break;
            case 'Thu':
                return 'r';
                break;
            case 'Fri':
                return 'f';
                break;
            case 'Sat':
                return 's';
                break;
            
        }
    }

	changeState(obj){

		
        // NCO - Not Checked Out
        // NCI - Not Checked In
        // CO - Checked Out
        // CI - Checked In
        let status = '';

        if(obj.Status == "NCI"){
            let d = this.getDayIndex(todayDate.substring(0,3));
            if(!(obj.Days).includes(d)) {
              
              alert("Select today to check in!!");
            } else {
            
            status = "CI"
            obj.Status = status
            this.updateStatusQuery(obj)
          }
        }
        else{
            if(obj.Status == "CI") {
                status="CO"
                obj.Status = status
                 this.updateStatusQuery(obj)
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

        event.preventDefault();
	}

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

	 toDatetime(date){ // THIS IS PROBABLY INFACT Date.toISOString
            let formatted = `${date.getFullYear()}-${this.sqlParse(date.getMonth() + 1)}-${this.sqlParse(date.getDate())} ${this.sqlParse(date.getHours())}:${this.sqlParse(date.getMinutes())}:${this.sqlParse(date.getSeconds())}`
            return formatted
        }
       
       
     sqlParse(val){ //sql requires date values to be in 02-07-2018 rather than 2-7-2017
            if (val < 10)
                return '0' + val
            else
                return val
        }

	render(){
		let curList = this.props.current.sort(function(a,b){return a.DateIn < b.DateIn})
		// TODO: Add first-to-last & last-to-first switch
		return(
			<div>
				<table className = "table table-hover" style={{marginTop: '20px'}}>
					<thead>
						<tr>
							<th style={{width: '18%'}}>Client Name</th>
							<th style={{width: '12%'}}>Dog Name</th>
							<th style={{width: '23%'}}>Date In</th>
							<th style={{width: '23%'}}>Date Out</th>
							<th style={{width: '24%'}}>Status</th>
						</tr>
					</thead>
					<tbody>
					{
					curList.map(obj => //arrow function instead
						<tr style={{height: '50px'}} key = {obj.BookingID}>
								<td>{obj.FirstName} {obj.LastName}</td>
								<td>{obj.AnimalName}</td>
								<td>{parseDate(obj.DateIn)}</td>
								<td>{parseDate(obj.DateOut)}</td>
								<td style={{textAlign:"right"}}><span style = {this.getStatus(obj) == ('Checked-Out') ? coStyle : this.getStatus(obj) == ('Checked-In') ? ciStyle : notStyle}><b>{this.getStatus(obj)}</b></span>
								{this.getStatus(obj) == ('Checked-Out') ? '' : <button className = "checkButton" onClick ={() => {this.changeState(obj)}}> {this.getNextAction(obj)} </button> }</td>
						</tr>
						)
					}
					</tbody>
				</table>
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
