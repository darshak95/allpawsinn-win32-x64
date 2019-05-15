'use babel';
import React, { Component } from 'react';

const sql = require('mssql')
const sqlConfig = require('../../js/sqlconfig')

export default class Tax extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        	taxSetting: {
            Month: 0,
            Year: 0
          },
          Month: '',
          totalTaxPaid: 0,
          totalAmountPaid: 0
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handlePrint = this.handlePrint.bind(this);
        this.getMonthByIndex = this.getMonthByIndex.bind(this);
    }

    async handleQuery(taxSetting) {
      let pool = await sql.connect(sqlConfig);
      let Month = parseInt(taxSetting.Month)
      let Year = parseInt(taxSetting.Year)
      let query = ''
      
      if(Month != 0) {
        query = `SELECT SUM(TaxPaid) as TaxPaid, SUM(AmountReceived) as TotalChargesPaid from dbo.Payments Where Year(PaymentDate)=${Year} AND Month(PaymentDate)=${Month}`;
      }

      else if(Month == 0) {
        query = `SELECT SUM(TaxPaid) as TaxPaid, SUM(AmountReceived) as TotalChargesPaid from dbo.Payments Where Year(PaymentDate)=${Year}`;
      }

      else {
        query = `SELECT SUM(TaxPaid) as TaxPaid, SUM(AmountReceived) as TotalChargesPaid from dbo.Payments Where Year(PaymentDate)=${Year} AND Month(PaymentDate)=${Month}`;
      }

      let result = await pool.request()
            .query(query);

     
      sql.close();
      if(!result.recordset[0].TaxPaid){
      	this.setState({
      	totalTaxPaid: "No taxes in this month",
      	totalAmountPaid: "No amount in this month",
        Month: Month
      	})
      } else {
      this.setState({
      	totalTaxPaid: result.recordset[0].TaxPaid,
      	totalAmountPaid: result.recordset[0].TotalChargesPaid,
        Month: Month
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

    getMonthByIndex(month) {
        switch (month) {
            case 1:
                return 'January';
                break;
            case 2:
                return 'February';
                break;
            case 3:
                return 'March';
                break;
            case 4:
                return 'April';
                break;
            case 5:
                return 'May';
                break;
            case 6:
                return 'June';
                break;
            case 7:
                return 'July';
                break;
            case 8:
                return 'August';
                break;
            case 9:
                return 'September';
                break;
            case 10:
                return 'October';
                break;
            case 11:
                return 'November';
                break;
            case 12:
                return 'December';
                break;
        }
    }


 render() {
  let month  = this.getMonthByIndex(this.state.Month);
        return (
            <div>
                <div className="box cal" id="admin">
        
                    <h3>Tax Information</h3><br></br>
                    <div>
                        <form>
                            <div className="box">
                                <div className="row">
                                    <div className="col-sm-6"><b>Month: </b><br></br></div>
                                    <div className="col-sm-6"><input name="Month" type="number" value={this.state.taxSetting.Month} onChange={this.handleChange} /><br></br></div>
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
                      
                      {this.state.totalTaxPaid ?  ((this.state.Month) ?

                       <div>
                         <div>
                      <br></br>
                      <br></br>
                      <div>
                       <p className="text-info">{`All Paws Inn Tax for the year ${this.state.taxSetting.Year} and Month ${month}`}</p>
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
                 </div> : 
                       <div>
                      	<div>
                      <br></br>
                      <br></br>
	                 <div>
                     <p className="text-info">{`All Paws Inn Tax for the year ${this.state.taxSetting.Year}`}</p>
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
                 </div>) : <div></div>}
             
           		</div> 
                             
             </div>               
        )
    }

}
