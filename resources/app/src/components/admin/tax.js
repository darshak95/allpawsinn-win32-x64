'use babel';
import React, { Component } from 'react';

const sql = require('mssql')
const sqlConfig = require('../../js/sqlconfig')

export default class Tax extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        	taxSetting: {
            FirstName: '',
            LastName: '',
            Quarter: 0,
            Year: 0,
          },
          FirstName: '',
          LastName: '',
          totalTaxPaid: 0,
          totalAmountPaid: 0
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handlePrint = this.handlePrint.bind(this);
    }

    async handleQuery(taxSetting) {
      let pool = await sql.connect(sqlConfig);
      let FirstName = taxSetting.FirstName
      let LastName = taxSetting.LastName
      let Quarter = parseInt(taxSetting.Quarter)
      let Year = parseInt(taxSetting.Year)
      let month1 = 3*Quarter
      let month2 = (3*Quarter)-1
      let month3 = (3*Quarter)-2
      let query = ''
      
      if(FirstName === '' && LastName === '' && Quarter != 0) {
        query = `SELECT SUM(TaxPaid) as TaxPaid, SUM(AmountReceived) as TotalChargesPaid from dbo.Payments Where Year(PaymentDate)=${Year} AND Month(PaymentDate) IN(${month1}, ${month2}, ${month3})`;
      }

      else if(FirstName === '' && LastName === '' && Quarter == 0) {
        query = `SELECT SUM(TaxPaid) as TaxPaid, SUM(AmountReceived) as TotalChargesPaid from dbo.Payments Where Year(PaymentDate)=${Year}`;
      }

      else {
        query = `SELECT SUM(TaxPaid) as TaxPaid, SUM(AmountReceived) as TotalChargesPaid, FirstName, LastName from dbo.Payments Where FirstName='${FirstName}' AND LastName='${LastName}' AND Year(PaymentDate)=${Year} AND Month(PaymentDate) IN(${month1}, ${month2}, ${month3}) GROUP BY FirstName, LastName`;
      }

      let result = await pool.request()
            .query(query);

      console.log("tax query", query);
      console.log("result", result.recordset[0])
      sql.close();
      if(!result.recordset[0]){
      	this.setState({
      	FirstName: FirstName,
      	LastName: LastName,
      	totalTaxPaid: "The user has paid no tax in this quarter",
      	totalAmountPaid: "The user has not paid any amount in this quarter"
      	})
      } else {
      this.setState({
      	FirstName: result.recordset[0].FirstName,
      	LastName: result.recordset[0].LastName,
      	totalTaxPaid: result.recordset[0].TaxPaid,
      	totalAmountPaid: result.recordset[0].TotalChargesPaid
       })
      }

     }

    handlePrint(event) {
        window.print()
    }

    handleChange(event) {
      
      let dummy = this.state.taxSetting;
        dummy[event.target.name] = event.target.value;
        this.setState({
            taxSetting: dummy
        })
    }
  
    handleSubmit(event) {
    this.handleQuery(this.state.taxSetting);
    event.preventDefault();

    }


 render() {
        return (
            <div>
                <div className="box cal" id="admin">
        
                    <h3>Tax Information</h3><br></br>
                    <div>
                        <form>
                            <div className="box">
                                <div className="row">
                                    <div className="col-sm-6"><b>First Name: </b><br></br></div>
                                    <div className="col-sm-6"><input name="FirstName" type="text" value={this.state.taxSetting.FirstName} onChange={this.handleChange} /><br></br></div>
                                </div>
                                <div className="row">
                                    <div className="col-sm-6"><b>Last Name: </b><br></br></div>
                                    <div className="col-sm-6"><input name="LastName" type="text" value={this.state.taxSetting.LastName} onChange={this.handleChange} /><br></br></div>
                                </div>
                                <div className="row">
                                    <div className="col-sm-6"><b>Quarter(1-4): </b><br></br></div>
                                    <div className="col-sm-6"><input name="Quarter" type="number" value={this.state.taxSetting.Quarter} onChange={this.handleChange} /><br></br></div>
                                </div>
                                <div className="row">
                                    <div className="col-sm-6"><b>Year: </b><br></br></div>
                                    <div className="col-sm-6"><input name="Year" type="number" value={this.state.taxSetting.Year} onChange={this.handleChange} /><br></br></div>
                                </div>
                            </div>
                            <br></br>
                            <button className="profileButton" onClick={this.handleSubmit}> Get Info </button>
        
                            <br></br>

                        </form>
                    </div>
                      
                      {this.state.totalTaxPaid ? 
                       <div>
                      	<div>
                      <br></br>
                      <br></br>
	                 <div>
	                   <p className="font-weight-bold"> First Name: </p>
	                   <p className="text-info"> {this.state.FirstName} </p>
	                 </div>                 
	                 <div>
	                   <p className="font-weight-bold"> Last Name: </p>
	                   <p className="text-info"> {this.state.LastName} </p>
	                 </div>                 
	                 <div>
	                   <p className="font-weight-bold"> Total Tax Paid: $</p>
	                   <p className="text-info">{this.state.totalTaxPaid}</p>
	                 </div>                 
	                 <div>
	                   <p className="font-weight-bold"> Total Amount Paid: $</p>
	                   <p className="text-info">{this.state.totalAmountPaid}</p>
	                 </div>                 
                    </div>
                 <span className="print"><button className="profileButton" onClick={this.handlePrint}> Print </button></span>
                 </div> : <div></div>}
             
           		</div> 
                             
             </div>               
        )
    }

}
