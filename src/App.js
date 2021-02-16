import React, { Component } from "react";
import "./App.css";
import Typography from "@material-ui/core/Typography";
import "typeface-roboto";
import Button from "@material-ui/core/Button";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/es/Toolbar/Toolbar";
import List from "@material-ui/core/es/List/List";
import ListItem from "@material-ui/core/es/ListItem/ListItem";
import DatetimeRangePicker from "react-datetime-range-picker";
import Select from "react-select";
import Divider from "@material-ui/core/es/Divider/Divider";
import LinearProgress from "@material-ui/core/es/LinearProgress/LinearProgress";
import Grid from "@material-ui/core/Grid";

var api_url = "https://www.swiggy.com/dapi/order/all?order_id=";
var invoice_url = "https://www.swiggy.com/invoice/download/";

class App extends Component {
  state = {
    ml: [],
    loaded: false,
    selected: [],
    dateRangeSelection: {
      start: false,
      end: false
    }
  };

  constructor() {
    super();
    this.total_orders = [];

    this.onClick = this.onClick.bind(this);
    this.onClickDownload = this.onClickDownload.bind(this);
    this.onChangeDate = this.onChangeDate.bind(this);
    this.continuousDownload = this.continuousDownload.bind(this);
    this.filtered = this.filtered.bind(this);
  }

  continuousDownload() {
    let total_orders = [];
    let final_length;
    const next = (lastorderid) => {
      fetch(api_url + lastorderid)
        .then((response) => response.json())
        .then((response) => {
          if (!final_length) {
            if (!response.data) {
              alert("Log into Swiggy first!");
            }
            final_length = response.data.total_orders;
            this.setState({ total: final_length });
          }
          let orders = response.data.orders;
          total_orders = total_orders.concat(orders);
          this.total_orders = total_orders;
          this.setState({ ml: total_orders });
          if (total_orders.length < final_length && orders.length > 0) {
            lastorderid = orders[orders.length - 1].order_id;
            next(lastorderid);
          } else {
            this.setState({ loaded: true });
          }
        });
    };
    next("");
  }

  onClick(e) {
    this.continuousDownload();
  }

  filtered(x) {
    let filtered = x.filter((obj) => {
      let date = Date.parse(obj.order_time);
      let start = this.state.dateRangeSelection.start
        ? date > this.state.dateRangeSelection.start
        : true;
      let end = this.state.dateRangeSelection.end
        ? date < this.state.dateRangeSelection.end
        : true;
      return start && end;
    });
    if (this.state.selected.length > 0) {
      filtered = filtered.filter((obj) => {
        return this.state.selected
          .map((obj) => obj.value)
          .includes(obj.delivery_address.city);
      });
    }
    return filtered;
  }

  downloadInvoice(id) {
    window.chrome.downloads.download({
      url: invoice_url + id
    });
  }

  handleSelect = (selected) => {
    this.setState({ selected });
  };

  onChangeDate(selection) {
    this.setState({ dateRangeSelection: selection });
  }

  getOptions() {
    let options = [
      ...new Set(this.total_orders.map((obj) => obj.delivery_address.city))
    ];
    console.log(options);
    return options.map((obj) => ({ label: obj, value: obj }));
  }

  onClickDownload(e) {
    this.filtered(this.state.ml).forEach((obj) =>
      this.downloadInvoice(obj.order_id)
    );
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <AppBar position="static">
            <Toolbar>
              <Typography component="h1" variant="h5" color={"inherit"}>
                Swiggy receipt scraper
              </Typography>
            </Toolbar>
          </AppBar>

          <Grid container spacing={16} style={{ padding: 16 }}>
            <Grid item xs={12} justify={"center"}>
              <Button
                variant={"contained"}
                color={"secondary"}
                onClick={this.onClick}
              >
                Run Query
              </Button>
            </Grid>
            <Grid item xs={12}>
              {this.state.total ? (
                [
                  <h1>Total: {this.state.total}</h1>,
                  this.state.loaded ? (
                    <Grid container spacing={16}>
                      <Grid item xs={3}>
                        <Typography variant={"button"}>City:</Typography>
                      </Grid>
                      <Grid item xs={9}>
                        <Select
                          isMulti={true}
                          options={this.getOptions()}
                          value={this.state.selected}
                          onChange={this.handleSelect}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant={"button"}>Date Range:</Typography>
                      </Grid>
                      <Grid item xs={9}>
                        <DatetimeRangePicker onChange={this.onChangeDate} />
                      </Grid>
                      <Divider />
                      <Button
                        fullWidth={true}
                        variant={"contained"}
                        color={"primary"}
                        onClick={this.onClickDownload}
                      >
                        Download
                      </Button>
                    </Grid>
                  ) : (
                    <LinearProgress
                      variant={"determinate"}
                      value={(99 * this.state.ml.length) / this.state.total}
                    />
                  )
                ]
              ) : (
                <Typography align={"center"} variant={"display2"}>
                  Run query first!
                </Typography>
              )}
            </Grid>
          </Grid>
          <h2>Total Queried: {this.filtered(this.state.ml).length}</h2>
          <div className={"list-container"}>
            <List>
              {this.filtered(this.state.ml).map((obj) => (
                <ListItem>
                  #{obj.order_id} {obj.restaurant_name}
                </ListItem>
              ))}
            </List>
          </div>
        </header>
      </div>
    );
  }
}

export default App;
